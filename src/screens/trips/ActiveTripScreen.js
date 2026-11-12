import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import driverTripTranslations from '../../config/driverTripTranslations';
import tripPaymentTranslations from '../../config/tripPaymentTranslations';
import { calculateTripEarnings } from '../../config/pricing';
import { useDriverTrip } from '../../context/DriverTripContext';
import { MOCK_TRIP_PAYMENT_SCENARIOS } from '../../data/mockTripPaymentScenarios';
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
  in_progress: ['inProgressTitle', 'inProgressMessage'],
  completed: ['completedTitle', 'completedMessage'],
};

export default function ActiveTripScreen() {
  const router = useRouter();
  const completionLock = useRef(false);
  const {
    activeTrip,
    tripLocation,
    transitionActiveTrip,
    selectPaymentScenario,
    completeActiveTrip,
  } = useDriverTrip();
  const language = activeTrip?.language === 'en' ? 'en' : 'es';
  const copy = driverTripTranslations[language];
  const paymentCopy = tripPaymentTranslations[language];
  const [validationTime, setValidationTime] = useState(0);
  useEffect(() => {
    if (activeTrip?.status !== 'arriving') return undefined;
    const initialUpdate = setTimeout(() => setValidationTime(Date.now()), 0);
    const timer = setInterval(() => setValidationTime(Date.now()), 1000);
    return () => {
      clearTimeout(initialUpdate);
      clearInterval(timer);
    };
  }, [activeTrip?.status]);
  const fareCop = activeTrip?.status === 'completed'
    ? activeTrip.finalFareCop
    : activeTrip?.estimatedFareCop;
  const earnings = useMemo(
    () => calculateTripEarnings(fareCop ?? 0),
    [fareCop],
  );
  const tripRoute = useTripRoute({
    status: activeTrip?.status,
    location: tripLocation.location,
    pickup: activeTrip?.pickupLocation,
    destination: activeTrip?.destinationLocation,
  });
  const route = tripLocation.location ? tripRoute.route : null;
  const routeStatus = tripLocation.location ? tripRoute.status : 'idle';

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
  const isCompleted = activeTrip.status === 'completed';
  const isInProgress = activeTrip.status === 'in_progress';
  const isArriving = activeTrip.status === 'arriving';
  const pickupValidation = validatePickupProximity(
    tripLocation.status === 'ready' ? tripLocation.location : null,
    activeTrip.pickupLocation,
    validationTime,
  );
  const boardingDisabled = isArriving && !pickupValidation.allowed;

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
          <RoutePoint label={copy.origin} value={activeTrip.origin} isOrigin={!isInProgress} />
          <View style={styles.routeConnector} />
          <RoutePoint label={copy.destination} value={activeTrip.destination} isDestination={isInProgress} />
          {isInProgress && route && (
            <View style={styles.tripMeta}>
              <Text style={styles.metaText}>{`${route.distanceKm.toFixed(1)} ${copy.km}`}</Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaText}>{`${Math.ceil(route.durationMinutes)} ${copy.minutes}`}</Text>
            </View>
          )}
        </View>

        {!isCompleted && route && (
          <View style={styles.metricsRow}>
            <Metric label={copy.distance} value={`${route.distanceKm.toFixed(1)} ${copy.km}`} />
            <Metric label={copy.duration} value={`${Math.ceil(route.durationMinutes)} ${copy.minutes}`} />
          </View>
        )}

        {isInProgress && (
          <View style={styles.paymentScenarioCard}>
            <Text style={styles.scenarioTitle}>{paymentCopy.scenarioTitle}</Text>
            <Text style={styles.scenarioHint}>{paymentCopy.scenarioHint}</Text>
            <View style={styles.scenarioList}>
              {MOCK_TRIP_PAYMENT_SCENARIOS.map((scenario) => {
                const isSelected = activeTrip.paymentScenarioId === scenario.id;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    key={scenario.id}
                    onPress={() => selectPaymentScenario(scenario.id)}
                    style={[styles.scenarioOption, isSelected && styles.scenarioOptionSelected]}
                  >
                    <Text style={[styles.scenarioOptionTitle, isSelected && styles.scenarioOptionTitleSelected]}>
                      {paymentCopy[scenario.titleKey]}
                    </Text>
                    <Text style={[styles.scenarioOptionStatus, isSelected && styles.scenarioOptionTitleSelected]}>
                      {paymentCopy[scenario.statusKey]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.fareCard}>
          <Text style={styles.fareHeading}>{copy.fare}</Text>
          <Text style={styles.grossFare}>{formatCopCurrency(earnings.grossFareCop)}</Text>
          <View style={styles.divider} />
          <DetailRow label={copy.commission} value={`−${formatCopCurrency(earnings.platformCommissionCop)}`} />
          <View style={styles.netRow}>
            <Text style={styles.netLabel}>{copy.net}</Text>
            <Text style={styles.netValue}>{formatCopCurrency(earnings.driverNetCop)}</Text>
          </View>
        </View>

        {!isCompleted ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: boardingDisabled }}
            disabled={boardingDisabled}
            onPress={() => {
              if (isInProgress) {
                if (completionLock.current) return;
                completionLock.current = true;
                if (completeActiveTrip()) {
                  router.push('/trip-payment-summary');
                } else {
                  completionLock.current = false;
                }
                return;
              }
              if (isArriving && !pickupValidation.allowed) return;
              transitionActiveTrip(activeTrip.status === 'accepted' ? 'arriving' : 'in_progress');
            }}
            style={({ pressed }) => [styles.primaryButton, boardingDisabled && styles.disabledButton, pressed && !boardingDisabled && styles.pressed]}
          >
            <Text style={styles.primaryButtonText}>
              {copy[isInProgress ? 'finishTrip' : activeTrip.status === 'accepted' ? 'goToPassenger' : 'passengerOnboard']}
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
        {isArriving && (
          <Text accessibilityLiveRegion="polite" style={[styles.pickupValidation, pickupValidation.allowed && styles.pickupValidationReady]}>
            {getPickupValidationMessage(copy, pickupValidation)}
          </Text>
        )}
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
  paymentScenarioCard: { backgroundColor: COLORS.white, borderRadius: 16, marginTop: 12, padding: 14 },
  scenarioTitle: { color: COLORS.ink, fontSize: 12, fontWeight: '800' },
  scenarioHint: { color: COLORS.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
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
