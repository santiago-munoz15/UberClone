import { Link, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tripHistoryTranslations from '../../config/tripHistoryTranslations';
import { useDriverTrip } from '../../context/DriverTripContext';
import { formatCopCurrency } from '../../utils/formatCopCurrency';

const COLORS = {
  background: '#F4F5F2',
  ink: '#171914',
  muted: '#71766A',
  white: '#FFFFFF',
};

const PAYMENT_STATUS_KEYS = {
  approved: 'approved',
  pending: 'pending',
  rejected: 'rejected',
  cash: 'cash',
};

export default function TripHistoryDetailScreen() {
  const { tripId } = useLocalSearchParams();
  const { completedTrips } = useDriverTrip();
  const normalizedTripId = Array.isArray(tripId) ? tripId[0] : tripId;
  const trip = completedTrips.find((item) => item.id === normalizedTripId);
  const language = trip?.language === 'en' ? 'en' : 'es';
  const copy = tripHistoryTranslations[language];

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      {!trip ? (
        <View style={styles.notFound}>
          <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
          <Text style={styles.title}>{copy.tripNotFoundTitle}</Text>
          <Text style={styles.message}>{copy.tripNotFoundMessage}</Text>
          <HistoryLink copy={copy} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
          <Text style={styles.title}>{copy.detailTitle}</Text>
          <Text style={styles.completedAt}>{copy.completedAt}: {formatCompletedAt(trip.completedAt, language, copy.notAvailable)}</Text>

          <View style={styles.routeCard}>
            <RouteRow label={copy.origin} value={trip.origin || copy.notAvailable} markerStyle={styles.originMarker} />
            <View style={styles.routeConnector} />
            <RouteRow label={copy.destination} value={trip.destination || copy.notAvailable} markerStyle={styles.destinationMarker} />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{copy.trip}</Text>
            <DetailRow label={copy.category} value={trip.category || copy.notAvailable} />
            <DetailRow label={copy.distance} value={trip.distanceKm != null ? `${trip.distanceKm} km` : copy.notAvailable} />
            <DetailRow label={copy.duration} value={trip.estimatedDurationMinutes != null ? `${trip.estimatedDurationMinutes} min` : copy.notAvailable} />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{copy.fare}</Text>
            <DetailRow label={copy.fare} value={formatCopCurrency(Number(trip.finalFareCop) || 0)} />
            <DetailRow label={copy.commission} value={`−${formatCopCurrency(Number(trip.platformCommissionCop) || 0)}`} negative />
            <DetailRow label={copy.tip} value={formatCopCurrency(Number(trip.tipCop) || 0)} />
            <View style={styles.divider} />
            <DetailRow label={copy.net} value={formatCopCurrency((Number(trip.driverNetCop) || 0) + (Number(trip.tipCop) || 0))} strong />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{copy.paymentStatus}</Text>
            <DetailRow label={copy.paymentMethod} value={trip.paymentMethod || copy.notAvailable} />
            <DetailRow label={copy.paymentStatus} value={copy[PAYMENT_STATUS_KEYS[trip.paymentStatus] ?? 'notAvailable']} />
          </View>

          <HistoryLink copy={copy} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function formatCompletedAt(value, language, fallback) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? fallback
    : date.toLocaleString(language === 'en' ? 'en-US' : 'es-CO', { dateStyle: 'medium', timeStyle: 'short' });
}

function RouteRow({ label, value, markerStyle }) {
  return (
    <View style={styles.routeRow}>
      <View style={[styles.marker, markerStyle]} />
      <View style={styles.routeText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.routeValue}>{value}</Text>
      </View>
    </View>
  );
}

function DetailRow({ label, value, negative = false, strong = false }) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.rowLabel, strong && styles.strongLabel]}>{label}</Text>
      <Text style={[styles.rowValue, negative && styles.negativeValue, strong && styles.strongValue]}>{value}</Text>
    </View>
  );
}

function HistoryLink({ copy }) {
  return (
    <Link href="/trip-history" replace asChild>
      <Pressable accessibilityRole="button" style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
        <Text style={styles.backButtonText}>{copy.backToHistory}</Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: COLORS.background, flex: 1 },
  content: { paddingBottom: 32, paddingHorizontal: 20, paddingTop: 17 },
  eyebrow: { color: COLORS.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: COLORS.ink, fontSize: 25, fontWeight: '900', letterSpacing: -0.6, marginTop: 6 },
  completedAt: { color: COLORS.muted, fontSize: 10, marginTop: 7 },
  routeCard: { backgroundColor: COLORS.white, borderRadius: 18, marginTop: 16, padding: 16 },
  routeRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 11 },
  marker: { height: 11, marginTop: 4, width: 11 },
  originMarker: { backgroundColor: '#7C9820', borderRadius: 6 },
  destinationMarker: { backgroundColor: COLORS.ink, borderRadius: 2 },
  routeConnector: { borderColor: '#CCD1C5', borderLeftWidth: 1, borderStyle: 'dashed', height: 19, marginLeft: 5, marginVertical: 4 },
  routeText: { flex: 1 },
  rowLabel: { color: COLORS.muted, flex: 1, fontSize: 10, paddingRight: 10 },
  routeValue: { color: COLORS.ink, fontSize: 13, fontWeight: '700', lineHeight: 19, marginTop: 3 },
  card: { backgroundColor: COLORS.white, borderRadius: 17, marginTop: 12, paddingHorizontal: 15, paddingVertical: 7 },
  cardTitle: { color: COLORS.ink, fontSize: 12, fontWeight: '900', paddingTop: 8 },
  detailRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11 },
  rowValue: { color: COLORS.ink, fontSize: 11, fontWeight: '700', textAlign: 'right' },
  negativeValue: { color: '#A64F48' },
  strongLabel: { color: COLORS.ink, fontWeight: '900' },
  strongValue: { color: '#506518', fontSize: 14, fontWeight: '900' },
  divider: { backgroundColor: '#ECEEE8', height: 1 },
  notFound: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  message: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 8 },
  backButton: { alignItems: 'center', backgroundColor: COLORS.ink, borderRadius: 14, justifyContent: 'center', marginTop: 18, minHeight: 52, paddingHorizontal: 14 },
  backButtonText: { color: COLORS.white, fontSize: 12, fontWeight: '800' },
  pressed: { opacity: 0.75 },
});
