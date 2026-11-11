import { useCallback, useMemo, useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import incomingRequestTranslations from '../../config/incomingRequestTranslations';
import { calculateTripEarnings } from '../../config/pricing';
import { createMockIncomingRequest } from '../../data/mockIncomingRequest';
import useIncomingRequestCountdown, {
  INCOMING_REQUEST_TIMEOUT_SECONDS,
} from '../../hooks/useIncomingRequestCountdown';
import { transitionIncomingRequest } from '../../utils/transitionIncomingRequest';
import { useDriverTrip } from '../../context/DriverTripContext';

const COLORS = {
  accent: '#B7D52B',
  background: '#F4F5F2',
  ink: '#171914',
  muted: '#71766A',
  white: '#FFFFFF',
};

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  currency: 'COP',
  maximumFractionDigits: 0,
  style: 'currency',
});

export default function IncomingRequestScreen() {
  const router = useRouter();
  const { startTrip } = useDriverTrip();
  const copy = incomingRequestTranslations.es;
  const [request, setRequest] = useState(createMockIncomingRequest);
  const earnings = useMemo(
    () => calculateTripEarnings(request.estimatedFareCop),
    [request.estimatedFareCop],
  );
  const finishRequest = useCallback((status, cancellationReason = null) => {
    setRequest((current) => transitionIncomingRequest(current, status, cancellationReason));
  }, []);
  const acceptRequest = useCallback(() => {
    if (request.status !== 'requested') return;
    const acceptedRequest = transitionIncomingRequest(request, 'accepted');
    if (acceptedRequest.status !== 'accepted' || !startTrip(acceptedRequest)) return;

    finishRequest('accepted');
    router.push('/active-trip');
  }, [finishRequest, request, router, startTrip]);
  const rejectRequest = useCallback(
    (reason = 'driver_rejected') => finishRequest('cancelled', reason),
    [finishRequest],
  );
  const expireRequest = useCallback(() => rejectRequest('timeout'), [rejectRequest]);
  const isPending = request.status === 'requested';
  const remainingSeconds = useIncomingRequestCountdown({ isActive: isPending, onExpire: expireRequest });
  const timerProgress = (remainingSeconds / INCOMING_REQUEST_TIMEOUT_SECONDS) * 100;

  let resultTitle = '';
  let resultMessage = '';
  if (request.status === 'accepted') {
    resultTitle = copy.acceptedTitle;
    resultMessage = copy.acceptedMessage;
  } else if (request.status === 'cancelled') {
    resultTitle = copy.rejectedTitle;
    resultMessage = request.cancellationReason === 'timeout'
      ? copy.rejectedByTimeout
      : copy.rejectedByDriver;
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>UBERCLONE · CONDUCTOR</Text>
            <Text style={styles.title}>{copy.title}</Text>
          </View>
          <View style={styles.simulationBadge}>
            <View style={styles.simulationDot} />
            <Text style={styles.simulationBadgeText}>{copy.simulationBadge}</Text>
          </View>
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeText}>{copy.simulationNote}</Text>
        </View>

        {isPending ? (
          <View style={styles.timerCard}>
            <View style={styles.timerTopRow}>
              <Text style={styles.timerLabel}>{copy.timerLabel}</Text>
              <Text
                accessibilityLabel={`${remainingSeconds} ${copy.seconds}`}
                accessibilityLiveRegion="polite"
                style={[styles.timerValue, remainingSeconds <= 5 && styles.timerUrgent]}
              >
                {`00:${String(remainingSeconds).padStart(2, '0')}`}
              </Text>
            </View>
            <View
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: INCOMING_REQUEST_TIMEOUT_SECONDS, now: remainingSeconds }}
              style={styles.timerTrack}
            >
              <View style={[styles.timerFill, { width: `${timerProgress}%` }]} />
            </View>
          </View>
        ) : (
          <View style={[styles.resultCard, request.status === 'accepted' ? styles.acceptedCard : styles.rejectedCard]}>
            <Text style={styles.resultTitle}>{resultTitle}</Text>
            <Text style={styles.resultMessage}>{resultMessage}</Text>
          </View>
        )}

        <View style={styles.routeCard}>
          <RoutePoint label={copy.origin} value={request.origin} isOrigin />
          <View style={styles.routeConnector} />
          <RoutePoint label={copy.destination} value={request.destination} />
        </View>

        <View style={styles.metricsRow}>
          <Metric label={copy.distance} value={`${request.distanceKm.toFixed(1)} ${copy.km}`} />
          <Metric label={copy.duration} value={`${request.estimatedDurationMinutes} ${copy.minutes}`} />
        </View>

        <View style={styles.detailsCard}>
          <DetailRow label={copy.category} value={request.category} />
          <View style={styles.divider} />
          <DetailRow label={copy.paymentMethod} value={request.paymentMethod} />
        </View>

        <View style={styles.fareCard}>
          <Text style={styles.fareHeading}>{copy.fare}</Text>
          <Text style={styles.grossFare}>{currencyFormatter.format(earnings.grossFareCop)}</Text>
          <View style={styles.divider} />
          <DetailRow
            label={copy.commission}
            value={`−${currencyFormatter.format(earnings.platformCommissionCop)}`}
            subdued
          />
          <View style={styles.netRow}>
            <Text style={styles.netLabel}>{copy.net}</Text>
            <Text style={styles.netValue}>{currencyFormatter.format(earnings.driverNetCop)}</Text>
          </View>
        </View>

        {isPending ? (
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => rejectRequest()}
              style={({ pressed }) => [styles.rejectButton, pressed && styles.pressed]}
            >
              <Text style={styles.rejectButtonText}>{copy.reject}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={acceptRequest}
              style={({ pressed }) => [styles.acceptButton, pressed && styles.pressed]}
            >
              <Text style={styles.acceptButtonText}>{copy.accept}</Text>
            </Pressable>
          </View>
        ) : (
          <Link href="/driver-preview" asChild>
            <Pressable accessibilityRole="button" style={({ pressed }) => [styles.homeButton, pressed && styles.pressed]}>
              <Text style={styles.homeButtonText}>{copy.backHome}</Text>
            </Pressable>
          </Link>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function RoutePoint({ label, value, isOrigin = false }) {
  return (
    <View style={styles.routePoint}>
      <View style={[styles.routeMarker, isOrigin ? styles.originMarker : styles.destinationMarker]} />
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

function DetailRow({ label, value, subdued = false }) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, subdued && styles.subdued]}>{label}</Text>
      <Text style={[styles.detailValue, subdued && styles.subdued]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: COLORS.background, flex: 1 },
  content: { paddingBottom: 32, paddingHorizontal: 20, paddingTop: 16 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  eyebrow: { color: COLORS.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: COLORS.ink, fontSize: 26, fontWeight: '900', letterSpacing: -0.7, marginTop: 6 },
  simulationBadge: {
    alignItems: 'center',
    backgroundColor: '#EFF3DE',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 6,
    maxWidth: 120,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  simulationDot: { backgroundColor: '#829D22', borderRadius: 4, height: 7, width: 7 },
  simulationBadgeText: { color: '#596526', flexShrink: 1, fontSize: 8, fontWeight: '800' },
  notice: { alignItems: 'center', paddingVertical: 9 },
  noticeText: { color: COLORS.muted, fontSize: 10, textAlign: 'center' },
  timerCard: { backgroundColor: COLORS.ink, borderRadius: 18, marginBottom: 14, padding: 16 },
  timerTopRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  timerLabel: { color: '#E4E7DC', flex: 1, fontSize: 11, fontWeight: '600', paddingRight: 8 },
  timerValue: { color: COLORS.accent, fontSize: 24, fontVariant: ['tabular-nums'], fontWeight: '900' },
  timerUrgent: { color: '#FFB45E' },
  timerTrack: { backgroundColor: '#45483F', borderRadius: 4, height: 5, marginTop: 12, overflow: 'hidden' },
  timerFill: { backgroundColor: COLORS.accent, borderRadius: 4, height: '100%' },
  resultCard: { borderRadius: 18, marginBottom: 14, padding: 16 },
  acceptedCard: { backgroundColor: '#EAF3E6' },
  rejectedCard: { backgroundColor: '#F4EAE4' },
  resultTitle: { color: COLORS.ink, fontSize: 17, fontWeight: '800' },
  resultMessage: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  routeCard: { backgroundColor: COLORS.white, borderRadius: 18, padding: 16 },
  routePoint: { alignItems: 'flex-start', flexDirection: 'row', gap: 12 },
  routeMarker: { borderRadius: 7, height: 12, marginTop: 3, width: 12 },
  originMarker: { backgroundColor: '#7C9820' },
  destinationMarker: { backgroundColor: COLORS.ink, borderRadius: 2 },
  routeText: { flex: 1 },
  routeLabel: { color: COLORS.muted, fontSize: 10, fontWeight: '700' },
  routeValue: { color: COLORS.ink, fontSize: 14, fontWeight: '700', lineHeight: 20, marginTop: 3 },
  routeConnector: { borderColor: '#CCD1C5', borderLeftWidth: 1, borderStyle: 'dashed', height: 22, marginLeft: 5, marginVertical: 5 },
  metricsRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  metricCard: { backgroundColor: COLORS.white, borderRadius: 16, flex: 1, padding: 14 },
  metricLabel: { color: COLORS.muted, fontSize: 10, fontWeight: '600' },
  metricValue: { color: COLORS.ink, fontSize: 16, fontWeight: '800', marginTop: 6 },
  detailsCard: { backgroundColor: COLORS.white, borderRadius: 16, marginTop: 12, paddingHorizontal: 15 },
  detailRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  detailLabel: { color: COLORS.muted, flex: 1, fontSize: 11, paddingRight: 10 },
  detailValue: { color: COLORS.ink, fontSize: 12, fontWeight: '700', textAlign: 'right' },
  subdued: { color: COLORS.muted, fontWeight: '500' },
  divider: { backgroundColor: '#ECEEE8', height: 1 },
  fareCard: { backgroundColor: COLORS.white, borderRadius: 18, marginTop: 12, paddingHorizontal: 15 },
  fareHeading: { color: COLORS.muted, fontSize: 10, fontWeight: '700', marginTop: 14 },
  grossFare: { color: COLORS.ink, fontSize: 23, fontWeight: '900', marginBottom: 12, marginTop: 4 },
  netRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 15, paddingTop: 10 },
  netLabel: { color: COLORS.ink, flex: 1, fontSize: 11, fontWeight: '800', paddingRight: 8 },
  netValue: { color: '#506518', fontSize: 17, fontWeight: '900' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 18 },
  rejectButton: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderColor: '#D8DBD3',
    borderRadius: 15,
    borderWidth: 1,
    height: 54,
    justifyContent: 'center',
    minWidth: 105,
    paddingHorizontal: 16,
  },
  rejectButtonText: { color: COLORS.ink, fontSize: 13, fontWeight: '700' },
  acceptButton: { alignItems: 'center', backgroundColor: COLORS.ink, borderRadius: 15, flex: 1, height: 54, justifyContent: 'center' },
  acceptButtonText: { color: COLORS.white, fontSize: 13, fontWeight: '800' },
  homeButton: { alignItems: 'center', backgroundColor: COLORS.ink, borderRadius: 15, height: 54, justifyContent: 'center', marginTop: 18 },
  homeButtonText: { color: COLORS.white, fontSize: 13, fontWeight: '800' },
  pressed: { opacity: 0.76 },
});
