const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const { defineSecret, defineString } = require('firebase-functions/params');
const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { logger } = require('firebase-functions');
const { createHmac, timingSafeEqual } = require('node:crypto');
const { Buffer } = require('node:buffer');

initializeApp();

const db = getFirestore();
const messaging = getMessaging();
const mercadoPagoAccessToken = defineSecret('MERCADO_PAGO_ACCESS_TOKEN');
const mercadoPagoWebhookSecret = defineSecret('MERCADO_PAGO_WEBHOOK_SECRET');
const mercadoPagoWebhookUrl = defineString('MERCADO_PAGO_WEBHOOK_URL', { default: '' });

function isInvalidMessagingTokenError(error) {
  return error?.code === 'messaging/registration-token-not-registered'
    || error?.code === 'messaging/invalid-registration-token';
}

const PRICING = Object.freeze({
  baseFareCop: 3500,
  perKmCop: 1200,
  perMinuteCop: 250,
  minimumFareCop: 6000,
  commissionRate: 0.2,
  categoryMultipliers: Object.freeze({
    economy: 1,
    UberX: 1,
    xl: 1.4,
    premium: 1.8,
  }),
});

function calculateFare({ distanceKm = 0, durationMin = 0, category = 'economy', tip = 0 }) {
  const distance = Math.max(0, Number(distanceKm) || 0);
  const duration = Math.max(0, Number(durationMin) || 0);
  const tipCop = Math.max(0, Math.round(Number(tip) || 0));
  const multiplier = PRICING.categoryMultipliers[category] ?? PRICING.categoryMultipliers.economy;
  const calculatedFare = (
    PRICING.baseFareCop
    + distance * PRICING.perKmCop
    + duration * PRICING.perMinuteCop
  ) * multiplier;
  const fare = Math.max(PRICING.minimumFareCop, Math.round(calculatedFare / 100) * 100);
  const commission = Math.round(fare * PRICING.commissionRate);

  return {
    fare,
    commission,
    driverNetCop: fare - commission,
    tip: tipCop,
    commissionRate: PRICING.commissionRate,
  };
}

function isValidCompletionLocation(location, destination) {
  if (!location || !destination) return false;
  if (![location.latitude, location.longitude, destination.latitude, destination.longitude]
    .every((value) => Number.isFinite(value))) return false;
  if (Math.abs(location.latitude) > 90 || Math.abs(destination.latitude) > 90
    || Math.abs(location.longitude) > 180 || Math.abs(destination.longitude) > 180) return false;
  if (!Number.isFinite(location.accuracy) || location.accuracy < 0 || location.accuracy > 30) return false;
  const now = Date.now();
  if (!Number.isFinite(location.timestamp) || now - location.timestamp < 0
    || now - location.timestamp > 10_000) return false;

  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(destination.latitude - location.latitude);
  const longitudeDelta = toRadians(destination.longitude - location.longitude);
  const firstLatitude = toRadians(location.latitude);
  const secondLatitude = toRadians(destination.latitude);
  const haversine = (Math.sin(latitudeDelta / 2) ** 2)
    + Math.cos(firstLatitude) * Math.cos(secondLatitude) * (Math.sin(longitudeDelta / 2) ** 2);
  const distanceMeters = 6_371_000 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return distanceMeters <= 100;
}

exports.completeDriverTrip = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesión para completar el viaje.');
    }

    const { tripId, currentLocation } = request.data || {};
    if (typeof tripId !== 'string' || !tripId) {
      throw new HttpsError('invalid-argument', 'tripId es obligatorio.');
    }

    const tripRef = db.collection('trips').doc(tripId);
    const completion = await db.runTransaction(async (transaction) => {
      const tripSnapshot = await transaction.get(tripRef);
      if (!tripSnapshot.exists) {
        throw new HttpsError('not-found', 'El viaje no existe.');
      }

      const trip = tripSnapshot.data();
      if (trip.driverId !== request.auth.uid) {
        throw new HttpsError('permission-denied', 'No puedes completar este viaje.');
      }
      if (trip.status !== 'in_progress') {
        throw new HttpsError('failed-precondition', 'El viaje ya fue finalizado o no está en progreso.');
      }
      if (!isValidCompletionLocation(currentLocation, trip.destinationLocation)) {
        throw new HttpsError('failed-precondition', 'La ubicación no coincide con el destino.');
      }

      const fare = calculateFare({
        category: trip.category,
        distanceKm: trip.distanceKm,
        durationMin: trip.estimatedDurationMinutes,
        tip: trip.tipCop,
      });
      const completedAt = FieldValue.serverTimestamp();
      const paymentStatus = ['Efectivo', 'cash'].includes(trip.paymentMethod) ? 'cash' : 'pending';
      transaction.update(tripRef, {
        status: 'completed',
        finalFareCop: fare.fare,
        platformCommissionCop: fare.commission,
        driverNetCop: fare.driverNetCop,
        tipCop: fare.tip,
        commissionRate: fare.commissionRate,
        paymentStatus,
        completedAt,
        updatedAt: completedAt,
      });

      return {
        finalFareCop: fare.fare,
        platformCommissionCop: fare.commission,
        driverNetCop: fare.driverNetCop,
        tipCop: fare.tip,
        commissionRate: fare.commissionRate,
        paymentStatus,
      };
    });

    return {
      tripId,
      status: 'completed',
      ...completion,
      completedAt: new Date().toISOString(),
    };
  },
);

exports.confirmCashPayment = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesión para confirmar el efectivo.');
    }

    const { tripId } = request.data || {};
    if (typeof tripId !== 'string' || !tripId) {
      throw new HttpsError('invalid-argument', 'tripId es obligatorio.');
    }

    const tripRef = db.collection('trips').doc(tripId);
    await db.runTransaction(async (transaction) => {
      const tripSnapshot = await transaction.get(tripRef);
      if (!tripSnapshot.exists) {
        throw new HttpsError('not-found', 'El viaje no existe.');
      }

      const trip = tripSnapshot.data();
      if (trip.driverId !== request.auth.uid) {
        throw new HttpsError('permission-denied', 'No puedes confirmar este viaje.');
      }
      if (trip.status === 'paid') {
        throw new HttpsError('failed-precondition', 'El efectivo ya fue confirmado.');
      }
      if (trip.status !== 'completed') {
        throw new HttpsError('failed-precondition', 'El viaje aún no está completado.');
      }
      if (!['Efectivo', 'cash'].includes(trip.paymentMethod) || trip.paymentStatus !== 'cash') {
        throw new HttpsError('failed-precondition', 'El viaje no corresponde a un pago en efectivo.');
      }

      transaction.update(tripRef, {
        status: 'paid',
        paidAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return {
      tripId,
      status: 'paid',
      paymentStatus: 'cash',
    };
  },
);

exports.createMercadoPagoPreference = onCall(
  { secrets: [mercadoPagoAccessToken], region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesión para crear un pago.');
    }

    const { tripId } = request.data || {};
    if (typeof tripId !== 'string' || !tripId) {
      throw new HttpsError('invalid-argument', 'tripId es obligatorio.');
    }

    const tripRef = db.collection('trips').doc(tripId);
    const tripSnapshot = await tripRef.get();
    if (!tripSnapshot.exists) {
      throw new HttpsError('not-found', 'El viaje no existe.');
    }

    const trip = tripSnapshot.data();
    const isTripParticipant = trip.passengerId === request.auth.uid || trip.driverId === request.auth.uid;
    if (!isTripParticipant) {
      throw new HttpsError('permission-denied', 'No puedes pagar este viaje.');
    }
    if (trip.status !== 'completed' || trip.paymentStatus === 'approved') {
      throw new HttpsError('failed-precondition', 'El viaje no está listo para pagar.');
    }

    const amount = Number(trip.finalFareCop);
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new HttpsError('failed-precondition', 'El viaje no tiene una tarifa válida.');
    }

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mercadoPagoAccessToken.value()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{
          id: tripId,
          title: `Viaje UberClone ${tripId}`,
          quantity: 1,
          currency_id: 'COP',
          unit_price: amount,
        }],
        external_reference: tripId,
        payer: request.auth.token.email ? { email: request.auth.token.email } : undefined,
        ...(mercadoPagoWebhookUrl.value()
          ? { notification_url: mercadoPagoWebhookUrl.value() }
          : {}),
      }),
    });

    const preference = await response.json();
    if (!response.ok || !preference.id) {
      logger.error('Mercado Pago rechazó la preferencia', { status: response.status, preference });
      throw new HttpsError('internal', 'No fue posible crear la preferencia de pago.');
    }

    await tripRef.update({
      paymentMethod: 'mercado_pago',
      paymentStatus: 'pending',
      paymentPreferenceId: preference.id,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      preferenceId: preference.id,
      checkoutUrl: preference.sandbox_init_point || preference.init_point,
    };
  },
);

exports.mercadoPagoWebhook = onRequest(
  { secrets: [mercadoPagoAccessToken, mercadoPagoWebhookSecret], region: 'us-central1' },
  async (request, response) => {
    if (request.method !== 'POST') {
      response.status(405).send('Method Not Allowed');
      return;
    }

    const configuredSecret = mercadoPagoWebhookSecret.value();
    const signature = request.get('x-signature');
    const requestId = request.get('x-request-id');
    const paymentId = request.body?.data?.id || request.query?.['data.id'];
    if (!configuredSecret || !signature || !requestId || !paymentId) {
      response.status(401).send('Unauthorized');
      return;
    }

    const signatureParts = Object.fromEntries(
      signature.split(',').map((part) => part.trim().split('=')),
    );
    const timestamp = Number(signatureParts.ts);
    const signatureValue = signatureParts.v1;
    const signatureAge = Math.abs(Date.now() - timestamp * 1000);
    if (!Number.isFinite(timestamp) || !signatureValue || signatureAge > 15 * 60 * 1000) {
      response.status(401).send('Unauthorized');
      return;
    }
    const manifest = `id:${paymentId};request-id:${requestId};ts:${timestamp};`;
    const expectedSignature = createHmac('sha256', configuredSecret).update(manifest).digest('hex');
    const signaturesMatch = signatureValue.length === expectedSignature.length
      && timingSafeEqual(Buffer.from(signatureValue), Buffer.from(expectedSignature));
    if (!signaturesMatch) {
      response.status(401).send('Unauthorized');
      return;
    }

    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Bearer ${mercadoPagoAccessToken.value()}` },
    });
    const payment = await paymentResponse.json();
    if (!paymentResponse.ok || !payment.external_reference) {
      logger.error('No se pudo consultar el pago de Mercado Pago', {
        status: paymentResponse.status,
        paymentId,
        payment,
      });
      response.status(502).send('Payment lookup failed');
      return;
    }

    const tripRef = db.collection('trips').doc(String(payment.external_reference));
    const tripSnapshot = await tripRef.get();
    if (!tripSnapshot.exists) {
      response.status(404).send('Trip not found');
      return;
    }
    const trip = tripSnapshot.data();
    const expectedAmount = Number(trip.finalFareCop);
    const amountMatches = Number(payment.transaction_amount) === expectedAmount;
    const currencyMatches = payment.currency_id === 'COP';
    const preferenceMatches = !trip.paymentPreferenceId
      || String(payment.preference_id) === String(trip.paymentPreferenceId);
    if (!amountMatches || !currencyMatches || !preferenceMatches) {
      logger.error('El pago de Mercado Pago no coincide con el viaje', {
        paymentId,
        tripId: payment.external_reference,
        amountMatches,
        currencyMatches,
        preferenceMatches,
      });
      response.status(422).send('Payment does not match trip');
      return;
    }

    const statusMap = {
      approved: 'approved',
      pending: 'pending',
      in_process: 'pending',
      rejected: 'rejected',
      cancelled: 'rejected',
      refunded: 'rejected',
      charged_back: 'rejected',
    };
    const paymentStatus = statusMap[payment.status] || 'pending';
    const paymentEventRef = db.collection('paymentEvents').doc(String(payment.id));
    const webhookResult = await db.runTransaction(async (transaction) => {
      const eventSnapshot = await transaction.get(paymentEventRef);
      const currentTripSnapshot = await transaction.get(tripRef);
      const previousEvent = eventSnapshot.data();
      if (eventSnapshot.exists
        && (previousEvent?.paymentStatus === paymentStatus || previousEvent?.paymentStatus === 'approved')) {
        return 'duplicate';
      }

      const currentTrip = currentTripSnapshot.data();
      if (!currentTrip) throw new Error('Trip disappeared while processing payment.');
      if (currentTrip.status !== 'completed') return 'not_ready';
      if (!['mercado_pago', 'Mercado Pago'].includes(currentTrip.paymentMethod)) {
        return 'wrong_payment_method';
      }
      const paymentEventData = {
        paymentId: String(payment.id),
        tripId: String(payment.external_reference),
        paymentStatus,
        processedAt: FieldValue.serverTimestamp(),
      };
      if (eventSnapshot.exists) {
        transaction.update(paymentEventRef, paymentEventData);
      } else {
        transaction.create(paymentEventRef, paymentEventData);
      }
      transaction.update(tripRef, {
        paymentStatus,
        paymentId: String(payment.id),
        ...(paymentStatus === 'approved' ? { status: 'paid' } : {}),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return 'processed';
    });

    if (webhookResult === 'not_ready' || webhookResult === 'wrong_payment_method') {
      response.status(422).send('Trip is not eligible for this payment');
      return;
    }
    response.status(200).send('OK');
  },
);

exports.notifyDriverOfIncomingTrip = onDocumentCreated(
  'trips/{tripId}',
  async (event) => {
    const trip = event.data?.data();
    if (!trip || trip.status !== 'requested' || !trip.driverId) return;

    const driverRef = db.collection('drivers').doc(trip.driverId);
    const deliveryRef = db.collection('notificationDeliveries').doc(event.params.tripId);
    const deliveryClaimed = await db.runTransaction(async (transaction) => {
      const deliverySnapshot = await transaction.get(deliveryRef);
      const driverSnapshot = await transaction.get(driverRef);
      const driver = driverSnapshot.data();
      if (deliverySnapshot.exists || !driver?.isAvailable || !driver.pushToken) return false;
      transaction.create(deliveryRef, {
        tripId: event.params.tripId,
        driverId: trip.driverId,
        createdAt: FieldValue.serverTimestamp(),
      });
      return true;
    });
    if (!deliveryClaimed) return;

    const driverSnapshot = await driverRef.get();
    const pushToken = driverSnapshot.data()?.pushToken;
    const responseTimeSeconds = Number(trip.responseTimeSeconds) || 30;
    try {
      await messaging.send({
        token: pushToken,
        notification: {
          title: 'Nueva solicitud de viaje',
          body: `${trip.origin || 'Origen'} → ${trip.destination || 'Destino'} · ${trip.category || 'UberX'} · responde en ${responseTimeSeconds}s`,
        },
        android: {
          priority: 'high',
          notification: { channelId: 'trip-requests' },
        },
        data: {
          tripId: String(event.params.tripId),
          type: 'incoming_trip',
          url: '/incoming-request',
          origin: String(trip.origin || ''),
          destination: String(trip.destination || ''),
          category: String(trip.category || 'UberX'),
          responseTimeSeconds: String(responseTimeSeconds),
        },
      });
      await deliveryRef.update({ sentAt: FieldValue.serverTimestamp() });
    } catch (error) {
      const errorCode = typeof error?.code === 'string' ? error.code : 'unknown';
      if (isInvalidMessagingTokenError(error)) {
        const currentDriverSnapshot = await driverRef.get();
        if (currentDriverSnapshot.data()?.pushToken === pushToken) {
          await driverRef.update({
            pushToken: FieldValue.delete(),
            pushPlatform: FieldValue.delete(),
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      }
      await deliveryRef.update({
        failedAt: FieldValue.serverTimestamp(),
        failureCode: errorCode,
      });
      logger.error('No se pudo enviar la solicitud push al conductor', {
        tripId: event.params.tripId,
        driverId: trip.driverId,
        errorCode,
      });
    }
  },
);
