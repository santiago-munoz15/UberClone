import {
  arrayUnion,
  collection,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, auth, db } from '../config/firebase';
import { calculateFare } from '../config/pricing';

const tripsCollection = collection(db, 'trips');
const functions = getFunctions(app, 'us-central1');

function requireCurrentUser() {
  const user = auth.currentUser;
  if (!user || user.isAnonymous) {
    throw new Error('Debes iniciar sesión como conductor para continuar.');
  }
  return user;
}

export function updateDriverAvailability(isAvailable, location = null) {
  const user = requireCurrentUser();
  return updateDoc(doc(db, 'drivers', user.uid), {
    isAvailable,
    ...(location ? { lastLocation: location } : {}),
    updatedAt: serverTimestamp(),
  });
}

export function updateDriverLocation(location) {
  return updateDriverAvailability(true, location);
}

export function updateDriverPushToken(token, platform) {
  const user = requireCurrentUser();
  if (!token) throw new Error('El dispositivo no tiene un token de notificaciones válido.');
  return updateDoc(doc(db, 'drivers', user.uid), {
    pushToken: token,
    pushPlatform: platform,
    updatedAt: serverTimestamp(),
  });
}

export function clearDriverPushToken() {
  const user = requireCurrentUser();
  return updateDoc(doc(db, 'drivers', user.uid), {
    isAvailable: false,
    pushToken: deleteField(),
    updatedAt: serverTimestamp(),
  });
}

function tripDocumentData(trip, userId, status = trip.status) {
  const {
    id,
    ...tripFields
  } = trip;

  return {
    ...tripFields,
    tripId: trip.tripId || id,
    driverId: userId,
    status,
    isSimulated: trip.isSimulated === true,
    createdAt: trip.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

export async function createSimulatedTrip(trip) {
  const user = requireCurrentUser();
  const tripId = trip?.tripId || trip?.id;
  if (!tripId) throw new Error('El viaje simulado no tiene un identificador válido.');
  const tripRef = doc(db, 'trips', tripId);
  await setDoc(
    tripRef,
    tripDocumentData({ ...trip, tripId }, user.uid, trip.status || 'accepted'),
  );
  const snapshot = await getDoc(tripRef);
  if (!snapshot.exists() || snapshot.data().driverId !== user.uid) {
    throw new Error('El viaje simulado no quedó disponible para el conductor autenticado.');
  }
  return tripId;
}

export async function verifyTripDocument(tripId) {
  const user = requireCurrentUser();
  if (!tripId) throw new Error('El viaje no tiene un identificador válido.');
  const snapshot = await getDoc(doc(db, 'trips', tripId));
  if (!snapshot.exists()) {
    throw new Error(`El viaje ${tripId} no existe en Firestore.`);
  }
  if (snapshot.data().driverId !== user.uid) {
    throw new Error('El viaje no pertenece al conductor autenticado.');
  }
  return snapshot;
}

export function subscribeToIncomingTrips(onChange, onError) {
  const user = requireCurrentUser();
  const incomingQuery = query(
    tripsCollection,
    where('driverId', '==', user.uid),
  );

  return onSnapshot(
    incomingQuery,
    (snapshot) => onChange(
      snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .filter((trip) => trip.status === 'requested')
        .sort((a, b) => timestampValue(a.createdAt) - timestampValue(b.createdAt)),
    ),
    onError,
  );
}

export function subscribeToCompletedTrips(onChange, onError) {
  const user = requireCurrentUser();
  const completedQuery = query(
    tripsCollection,
    where('driverId', '==', user.uid),
  );

  return onSnapshot(
    completedQuery,
    (snapshot) => onChange(
      snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .filter((trip) => trip.status === 'completed' || trip.status === 'paid')
        .sort((a, b) => timestampValue(b.completedAt) - timestampValue(a.completedAt)),
    ),
    onError,
  );
}

export function subscribeToDriverActiveTrips(onChange, onError) {
  const user = requireCurrentUser();
  const activeQuery = query(
    tripsCollection,
    where('driverId', '==', user.uid),
  );

  return onSnapshot(
    activeQuery,
    (snapshot) => onChange(
      snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .filter((trip) => ['accepted', 'driver_arriving', 'arriving', 'onboard', 'in_progress'].includes(trip.status))
        .sort((a, b) => timestampValue(b.updatedAt) - timestampValue(a.updatedAt)),
    ),
    onError,
  );
}

export function subscribeToTrip(tripId, onChange, onError) {
  if (!tripId) throw new Error('El viaje no tiene un identificador válido.');
  return onSnapshot(
    doc(db, 'trips', tripId),
    (snapshot) => onChange(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null),
    onError,
  );
}

function timestampValue(value) {
  if (value?.toMillis) return value.toMillis();
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function updateTrip(tripId, fields) {
  const user = requireCurrentUser();
  if (!tripId) throw new Error('El viaje no tiene un identificador válido.');
  if (fields?.driverId && fields.driverId !== user.uid) {
    throw new Error('No puedes modificar el conductor asignado al viaje.');
  }
  return updateDoc(doc(db, 'trips', tripId), {
    ...fields,
    updatedAt: serverTimestamp(),
  });
}

export function appendTripRoutePoint(tripId, point, routeDataSource) {
  return appendTripRoutePoints(tripId, [point], routeDataSource);
}

export function appendTripRoutePoints(tripId, points, routeDataSource) {
  const user = requireCurrentUser();
  if (!tripId) throw new Error('El viaje no tiene un identificador válido.');
  if (!Array.isArray(points) || !points.length || points.some((point) => (
    !Number.isFinite(point?.latitude) || !Number.isFinite(point?.longitude)
  ))) {
    throw new Error('La ruta no tiene coordenadas válidas.');
  }
  if (!['device_gps', 'client_demo'].includes(routeDataSource)) {
    throw new Error('El origen de la ruta no es válido.');
  }
  return updateDoc(doc(db, 'trips', tripId), {
    routeCoordinates: arrayUnion(...points.map((point) => ({
      latitude: point.latitude,
      longitude: point.longitude,
    }))),
    routeDataSource,
    updatedAt: serverTimestamp(),
  }).then(() => user.uid);
}

export async function completeDriverTrip(tripId, currentLocation) {
  requireCurrentUser();
  if (!tripId) throw new Error('El viaje no tiene un identificador válido.');
  const completeTrip = httpsCallable(functions, 'completeDriverTrip');
  const result = await completeTrip({ tripId, currentLocation });
  if (!result.data?.tripId || result.data.tripId !== tripId) {
    throw new Error('La finalización del viaje no devolvió una respuesta válida.');
  }
  return result.data;
}

export async function completeSimulatedTrip(tripId) {
  const user = requireCurrentUser();
  if (!tripId) throw new Error('El viaje no tiene un identificador válido.');
  const tripRef = doc(db, 'trips', tripId);
  let completion;

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(tripRef);
    if (!snapshot.exists()) throw new Error('El viaje simulado no existe.');

    const trip = snapshot.data();
    if (trip.driverId !== user.uid) throw new Error('El viaje no pertenece al conductor autenticado.');
    if (trip.isSimulated !== true) throw new Error('Los viajes reales requieren backend para finalizarse.');
    if (trip.status !== 'in_progress') throw new Error('El viaje simulado ya fue finalizado o no está en progreso.');

    const fare = calculateFare({
      category: trip.category,
      distanceKm: trip.distanceKm,
      durationMin: trip.estimatedDurationMinutes,
      tip: trip.tipCop,
    });
    const paymentStatus = ['Efectivo', 'cash'].includes(trip.paymentMethod) ? 'cash' : 'pending';
    const completedAt = serverTimestamp();
    completion = {
      status: 'completed',
      finalFareCop: fare.fare,
      platformCommissionCop: fare.commission,
      driverNetCop: fare.fare - fare.commission,
      tipCop: fare.tip,
      commissionRate: fare.commissionRate,
      paymentStatus,
      financialDataSource: 'client_demo',
      completedAt: new Date().toISOString(),
    };

    transaction.update(tripRef, {
      ...completion,
      completedAt,
      updatedAt: completedAt,
    });
  });

  return { tripId, ...completion };
}

export async function confirmCashPayment(tripId) {
  requireCurrentUser();
  if (!tripId) throw new Error('El viaje no tiene un identificador válido.');
  const confirmPayment = httpsCallable(functions, 'confirmCashPayment');
  const result = await confirmPayment({ tripId });
  if (!result.data?.tripId || result.data.tripId !== tripId) {
    throw new Error('La confirmación del efectivo no devolvió una respuesta válida.');
  }
  return result.data;
}

export async function confirmSimulatedCashPayment(tripId) {
  const user = requireCurrentUser();
  if (!tripId) throw new Error('El viaje no tiene un identificador válido.');
  const tripRef = doc(db, 'trips', tripId);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(tripRef);
    if (!snapshot.exists()) throw new Error('El viaje simulado no existe.');

    const trip = snapshot.data();
    if (trip.driverId !== user.uid) throw new Error('El viaje no pertenece al conductor autenticado.');
    if (trip.isSimulated !== true) throw new Error('Los viajes reales requieren backend para confirmar pagos.');
    if (trip.status === 'paid') throw new Error('El efectivo simulado ya fue confirmado.');
    if (trip.status !== 'completed' || !['Efectivo', 'cash'].includes(trip.paymentMethod)) {
      throw new Error('El viaje simulado no está listo para confirmar efectivo.');
    }
    if (trip.paymentStatus !== 'cash') {
      throw new Error('El viaje simulado no tiene pago en efectivo.');
    }

    transaction.update(tripRef, {
      status: 'paid',
      paymentStatus: 'paid',
      paidAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  return { tripId, status: 'paid', paymentStatus: 'paid' };
}
