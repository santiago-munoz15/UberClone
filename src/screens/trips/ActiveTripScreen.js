import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import driverTripTranslations from '../../config/driverTripTranslations';
import tripPaymentTranslations from '../../config/tripPaymentTranslations';
import { calculateFare } from '../../config/pricing';
import { useDriverTrip } from '../../context/DriverTripContext';
import TripNavigationMap from '../../components/trips/TripNavigationMap';
import { formatCopCurrency } from '../../utils/formatCopCurrency';
import useTripRoute from '../../hooks/useTripRoute';
import { validatePickupProximity } from '../../utils/pickupProximity';

const COLORS = {
  accent: '#B7D52B',
  background: '#F4F5F2',
  ink: '#171914',
  muted: '#71766A',
  white: '#FFFFFF',
};

const STATUS_COPY = {
  accepted: ['acceptedTitle', 'acceptedMessage'],
  arriving: ['arrivingTitle', 'arrivingMessage'],
  onboard: ['onboardTitle', 'onboardMessage'],
  in_progress: ['inProgressTitle', 'inProgressMessage'],
  completed: ['completedTitle', 'completedMessage'],
  paid: ['completedTitle', 'completedMessage'],
};

export default function ActiveTripScreen() {
  const router = useRouter();
  const completionLock = useRef(false);
  const {
    activeTrip,
    tripError,
    tripLocation,
    transitionActiveTrip,
    simulatePickupArrival,
    simulateDestinationArrival,
    completeActiveTrip,
  } = useDriverTrip();
  const language = activeTrip?.language === 'en' ? 'en' : 'es';
  const copy = driverTripTranslations[language];
  const paymentCopy = tripPaymentTranslations[language];
  const [validationTime, setValidationTime] = useState(0);
  const [demoArrivalPending, setDemoArrivalPending] = useState(false);
  useEffect(() => {
    if (activeTrip?.status !== 'arriving' && activeTrip?.status !== 'in_progress') return undefined;
    const initialUpdate = setTimeout(() => setValidationTime(Date.now()), 0);
    const timer = setInterval(() => setValidationTime(Date.now()), 1000);
    return () => {
      clearTimeout(initialUpdate);
      clearInterval(timer);
    };
  }, [activeTrip?.status]);
  const earnings = useMemo(() => calculateFare({
    category: activeTrip?.category,
    distanceKm: activeTrip?.distanceKm,
    durationMin: activeTrip?.estimatedDurationMinutes,
    tip: activeTrip?.tipCop,
  }), [activeTrip?.category, activeTrip?.distanceKm, activeTrip?.estimatedDurationMinutes, activeTrip?.tipCop]);
  const tripRoute = useTripRoute({
    status: activeTrip?.status,
    location: tripLocation.location,
    pickup: activeTrip?.pickupLocation,
    destination: activeTrip?.destinationLocation,
    isSimulated: activeTrip?.isSimulated === true,
  });
  const route = tripRoute.route;
  const routeStatus = tripRoute.status;
  const demoRouteCoordinateCount = route?.coordinates?.filter(isValidRouteCoordinate).length ?? 0;
  const demoRouteReady = tripRoute.status === 'ready' && demoRouteCoordinateCount >= 5;

  if (!activeTrip) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.emptyState}>
          <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
          <Text style={styles.title}>{copy.noTripTitle}</Text>
          <Text style={styles.statusMessage}>{copy.noTripMessage}</Text>
          <Pressable onPress={() => router.replace('/incoming-request')} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryButtonText}>{copy.openRequests}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const [titleKey, messageKey] = STATUS_COPY[activeTrip.status] ?? STATUS_COPY.accepted;
  const isCompleted = activeTrip.status === 'completed' || activeTrip.status === 'paid';
  const isInProgress = activeTrip.status === 'in_progress';
  const isArriving = activeTrip.status === 'arriving';
  const isOnboard = activeTrip.status === 'onboard';
  const pickupValidation = validatePickupProximity(
    tripLocation.status === 'ready' ? tripLocation.location : null,
    activeTrip.pickupLocation,
    validationTime,
  );
  const boardingDisabled = isArriving && !pickupValidation.allowed;
  const destinationValidation = activeTrip.demoDestinationArrival && activeTrip.isSimulated
    ? { allowed: true, reason: 'ready', distanceMeters: 0 }
    : validatePickupProximity(
      tripLocation.status === 'ready' ? tripLocation.location : null,
      activeTrip.destinationLocation,
      validationTime,
    );
  const finishDisabled = isInProgress && !destinationValidation.allowed;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
            <Text style={styles.title}>{copy[titleKey]}</Text>
          </View>
          <View style={styles.simulationBadge}>
            <View style={styles.simulationDot} />
            <Text style={styles.simulationBadgeText}>{copy.simulation}</Text>
          </View>
        </View>

        <View style={[styles.statusCard, isCompleted && styles.completedCard]}>
          <Text style={styles.statusMessage}>{copy[messageKey]}</Text>
        </View>

        <TripNavigationMap
          compassStatus={tripLocation.compassStatus}
          deviceHeading={tripLocation.deviceHeading}
          language={language}
          location={tripLocation.location}
          locationStatus={tripLocation.status}
          onRetryLocation={tripLocation.retry}
          onRetryRoute={tripRoute.retry}
          pickup={activeTrip.pickupLocation}
          destination={activeTrip.destinationLocation}
          route={route}
          routeError={tripRoute.error}
          routeStatus={routeStatus}
          status={activeTrip.status}
        />

        <View style={styles.routeCard}>
          <RoutePoint label={copy.origin} value={activeTrip.origin} isOrigin={!isInProgress && !isOnboard} />
          <View style={styles.routeConnector} />
          <RoutePoint label={copy.destination} value={activeTrip.destination} isDestination={isInProgress || isOnboard} />
          {(isInProgress || isOnboard) && route && (
            <View style={styles.tripMeta}>
              <Text style={styles.metaText}>{`${route.distanceKm.toFixed(1)} ${copy.km}`}</Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaText}>{`${Math.ceil(route.durationMinutes)} ${copy.minutes}`}</Text>
            </View>
          )}
        </View>

        {!isCompleted && (isInProgress || isOnboard) && route && (
          <View style={styles.metricsRow}>
            <Metric label={copy.distance} value={`${route.distanceKm.toFixed(1)} ${copy.km}`} />
            <Metric label={copy.duration} value={`${Math.ceil(route.durationMinutes)} ${copy.minutes}`} />
          </View>
        )}

        <View style={styles.fareCard}>
          <Text style={styles.fareHeading}>{copy.fare}</Text>
          <Text style={styles.grossFare}>{formatCopCurrency(earnings.fare)}</Text>
          <View style={styles.divider} />
          <DetailRow label={copy.commission} value={`−${formatCopCurrency(earnings.commission)}`} />
          <View style={styles.netRow}>
            <Text style={styles.netLabel}>{copy.net}</Text>
            <Text style={styles.netValue}>{formatCopCurrency(earnings.driverEarnings)}</Text>
          </View>
        </View>

        {!isCompleted ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: boardingDisabled || finishDisabled }}
            disabled={boardingDisabled || finishDisabled}
            onPress={async () => {
              if (isInProgress) {
                if (completionLock.current) return;
                completionLock.current = true;
                if (await completeActiveTrip()) {
                  router.push('/trip-payment-summary');
                } else {
                  completionLock.current = false;
                }
                return;
              }
              if (isArriving && !pickupValidation.allowed) return;
              const nextStatus = activeTrip.status === 'accepted'
                ? 'arriving'
                : isArriving ? 'onboard' : isOnboard ? 'in_progress' : null;
              if (nextStatus) transitionActiveTrip(nextStatus);
            }}
            style={({ pressed }) => [styles.primaryButton, (boardingDisabled || finishDisabled) && styles.disabledButton, pressed && !boardingDisabled && !finishDisabled && styles.pressed]}
          >
            <Text style={styles.primaryButtonText}>
              {copy[isInProgress ? 'finishTrip' : isOnboard ? 'startDestinationTrip' : activeTrip.status === 'accepted' ? 'goToPassenger' : 'passengerOnboard']}
            </Text>
          </Pressable>
        ) : (
          <View>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/trip-payment-summary')}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.primaryButtonText}>{paymentCopy.viewPaymentSummary}</Text>
            </Pressable>
            <Link href="/driver-preview" asChild>
              <Pressable accessibilityRole="button" style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
                <Text style={styles.secondaryButtonText}>{copy.backHome}</Text>
              </Pressable>
            </Link>
          </View>
        )}
        {isArriving && !pickupValidation.allowed && __DEV__ ? (
          <Pressable
            accessibilityRole="button"
            onPress={simulatePickupArrival}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryButtonText}>{copy.simulatePickupArrival}</Text>
          </Pressable>
        ) : null}
        {isArriving && (
          <Text accessibilityLiveRegion="polite" style={[styles.pickupValidation, pickupValidation.allowed && styles.pickupValidationReady]}>
            {getPickupValidationMessage(copy, pickupValidation)}
          </Text>
        )}
        {isInProgress && !destinationValidation.allowed ? (
          <Text accessibilityLiveRegion="polite" style={styles.pickupValidation}>
            {getDestinationValidationMessage(copy, destinationValidation)}
          </Text>
        ) : null}
        {isInProgress && tripError ? (
          <Text accessibilityRole="alert" style={styles.pickupValidation}>
            {tripError.message === 'DEMO_ROUTE_UNAVAILABLE'
              ? copy.demoRouteUnavailable
              : tripError.message === 'DEMO_ROUTE_TOO_SHORT'
                ? copy.demoRouteTooShort
                : copy.routePersistenceError}
          </Text>
        ) : null}
        {isInProgress && activeTrip.isSimulated && !activeTrip.demoDestinationArrival && demoRouteLoadingMessage(tripRoute.status, demoRouteCoordinateCount, copy) ? (
          <Text accessibilityLiveRegion="polite" style={styles.pickupValidation}>
            {demoRouteLoadingMessage(tripRoute.status, demoRouteCoordinateCount, copy)}
          </Text>
        ) : null}
        {isInProgress && !destinationValidation.allowed && __DEV__ && activeTrip.isSimulated ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: demoArrivalPending || !demoRouteReady }}
            disabled={demoArrivalPending || !demoRouteReady}
            onPress={async () => {
              setDemoArrivalPending(true);
              try {
                await simulateDestinationArrival(tripRoute.route);
              } finally {
                setDemoArrivalPending(false);
              }
            }}
            style={({ pressed }) => [
              styles.secondaryButton,
              (!demoRouteReady || demoArrivalPending) && styles.disabledButton,
              pressed && demoRouteReady && !demoArrivalPending && styles.pressed,
            ]}
          >
            <Text style={styles.secondaryButtonText}>
              {demoArrivalPending ? copy.savingDemoRoute : copy.simulateDestinationArrival}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function getPickupValidationMessage(copy, validation) {
  if (validation.reason === 'ready') {
    return copy.pickupReady.replace('{distance}', `${Math.ceil(validation.distanceMeters)}`);
  }
  if (validation.reason === 'too_far') {
    return copy.pickupRemaining.replace('{distance}', `${Math.ceil(validation.distanceMeters)}`);
  }
  if (validation.reason === 'accuracy_insufficient') {
    return copy.pickupAccuracyInsufficient.replace('{distance}', `${Math.ceil(validation.distanceMeters)}`);
  }
  if (validation.reason === 'location_stale') return copy.pickupLocationStale;
  return copy.pickupLocationUnavailable;
}

function getDestinationValidationMessage(copy, validation) {
  const key = validation.reason === 'ready'
    ? 'destinationReady'
    : validation.reason === 'accuracy_insufficient'
      ? 'destinationAccuracyInsufficient'
      : validation.reason === 'location_stale'
        ? 'destinationLocationStale'
        : validation.reason === 'location_unavailable'
          ? 'destinationLocationUnavailable'
          : 'destinationRemaining';
  const distance = validation.distanceMeters === null ? '—' : `${Math.ceil(validation.distanceMeters)}`;
  return copy[key].replace('{distance}', distance);
}

function isValidRouteCoordinate(point) {
  return Number.isFinite(point?.latitude)
    && Number.isFinite(point?.longitude)
    && Math.abs(point.latitude) <= 90
    && Math.abs(point.longitude) <= 180;
}

function demoRouteLoadingMessage(status, coordinateCount, copy) {
  if (status === 'loading' || status === 'idle') return copy.routeCalculating;
  if (status === 'error') return copy.demoRouteServiceError;
  if (status === 'ready' && coordinateCount > 0 && coordinateCount < 5) return copy.demoRouteTooShort;
  return null;
}

function RoutePoint({ label, value, isOrigin = false, isDestination = false }) {
  return (
    <View style={styles.routePoint}>
      <View style={[styles.routeMarker, isOrigin ? styles.originMarker : styles.destinationMarker, isDestination && styles.activeDestinationMarker]} />
      <View style={styles.routeText}>
        <Text style={styles.routeLabel}>{label}</Text>
        <Text style={styles.routeValue}>{value}</Text>
      </View>
    </View>
  );
}

function Metric({ label, value }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: COLORS.background, flex: 1 },
  content: { paddingBottom: 32, paddingHorizontal: 20, paddingTop: 16 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  eyebrow: { color: COLORS.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: COLORS.ink, fontSize: 25, fontWeight: '900', letterSpacing: -0.6, marginTop: 6 },
  simulationBadge: { alignItems: 'center', backgroundColor: '#EFF3DE', borderRadius: 12, flexDirection: 'row', gap: 6, maxWidth: 112, paddingHorizontal: 9, paddingVertical: 8 },
  simulationDot: { backgroundColor: '#829D22', borderRadius: 4, height: 7, width: 7 },
  simulationBadgeText: { color: '#596526', flexShrink: 1, fontSize: 8, fontWeight: '800' },
  statusCard: { backgroundColor: '#EAF3E6', borderRadius: 16, marginTop: 18, padding: 16 },
  completedCard: { backgroundColor: '#EAF3E6', borderColor: '#C9DDAF', borderWidth: 1 },
  statusMessage: { color: COLORS.muted, fontSize: 13, lineHeight: 19 },
  routeCard: { backgroundColor: COLORS.white, borderRadius: 18, marginTop: 14, padding: 16 },
  routePoint: { alignItems: 'flex-start', flexDirection: 'row', gap: 12 },
  routeMarker: { borderRadius: 7, height: 12, marginTop: 3, width: 12 },
  originMarker: { backgroundColor: '#7C9820' },
  destinationMarker: { backgroundColor: COLORS.ink, borderRadius: 2 },
  activeDestinationMarker: { backgroundColor: '#7C9820', borderRadius: 7 },
  routeText: { flex: 1 },
  routeLabel: { color: COLORS.muted, fontSize: 10, fontWeight: '700' },
  routeValue: { color: COLORS.ink, fontSize: 14, fontWeight: '700', lineHeight: 20, marginTop: 3 },
  routeConnector: { borderColor: '#CCD1C5', borderLeftWidth: 1, borderStyle: 'dashed', height: 22, marginLeft: 5, marginVertical: 5 },
  tripMeta: { flexDirection: 'row', gap: 8, marginLeft: 24, marginTop: 12 },
  metaText: { color: COLORS.muted, fontSize: 11, fontWeight: '600' },
  metaDot: { color: COLORS.muted, fontSize: 11 },
  metricsRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  metricCard: { backgroundColor: COLORS.white, borderRadius: 16, flex: 1, padding: 14 },
  metricLabel: { color: COLORS.muted, fontSize: 10, fontWeight: '600' },
  metricValue: { color: COLORS.ink, fontSize: 16, fontWeight: '800', marginTop: 6 },
  scenarioList: { gap: 8, marginTop: 10 },
  scenarioOption: { borderColor: '#E1E4DC', borderRadius: 12, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 9 },
  scenarioOptionSelected: { backgroundColor: '#EFF3DE', borderColor: '#9DB52C' },
  scenarioOptionTitle: { color: COLORS.ink, fontSize: 11, fontWeight: '700' },
  scenarioOptionTitleSelected: { color: '#506518' },
  scenarioOptionStatus: { color: COLORS.muted, fontSize: 9, marginTop: 3 },
  fareCard: { backgroundColor: COLORS.white, borderRadius: 18, marginTop: 12, paddingHorizontal: 15 },
  fareHeading: { color: COLORS.muted, fontSize: 10, fontWeight: '700', marginTop: 14 },
  grossFare: { color: COLORS.ink, fontSize: 23, fontWeight: '900', marginBottom: 12, marginTop: 4 },
  divider: { backgroundColor: '#ECEEE8', height: 1 },
  detailRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12 },
  detailLabel: { color: COLORS.muted, flex: 1, fontSize: 11, paddingRight: 10 },
  detailValue: { color: COLORS.muted, fontSize: 12, fontWeight: '500', textAlign: 'right' },
  netRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 15, paddingTop: 10 },
  netLabel: { color: COLORS.ink, flex: 1, fontSize: 11, fontWeight: '800', paddingRight: 8 },
  netValue: { color: '#506518', fontSize: 17, fontWeight: '900' },
  primaryButton: { alignItems: 'center', backgroundColor: COLORS.ink, borderRadius: 15, justifyContent: 'center', marginTop: 18, minHeight: 54, paddingHorizontal: 16 },
  disabledButton: { backgroundColor: '#A9ADA2' },
  pickupValidation: { color: '#8E4B21', fontSize: 12, lineHeight: 18, marginTop: 10, textAlign: 'center' },
  pickupValidationReady: { color: '#4E7120' },
  primaryButtonText: { color: COLORS.white, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  secondaryButton: { alignItems: 'center', borderColor: '#D8DBD3', borderRadius: 15, borderWidth: 1, justifyContent: 'center', marginTop: 10, minHeight: 50, paddingHorizontal: 16 },
  secondaryButtonText: { color: COLORS.ink, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  pressed: { opacity: 0.76 },
});
