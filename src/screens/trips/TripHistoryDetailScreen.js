import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import tripHistoryTranslations from '../../config/tripHistoryTranslations';
import { useDriverTrip } from '../../context/DriverTripContext';
import { getCompletedAtDate } from '../../utils/aggregateDriverEarnings';
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
  paid: 'paid',
};

export default function TripHistoryDetailScreen() {
  const { tripId } = useLocalSearchParams();
  const { completedTrips } = useDriverTrip();
  const normalizedTripId = Array.isArray(tripId) ? tripId[0] : tripId;
  const trip = completedTrips.find((item) => item.id === normalizedTripId);
  const language = trip?.language === 'en' ? 'en' : 'es';
  const copy = tripHistoryTranslations[language];
  const mapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const routeData = useMemo(() => getRouteData(trip), [trip]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || routeData.mapCoordinates.length < 2) return;
    mapRef.current.fitToCoordinates(routeData.mapCoordinates, {
      edgePadding: { top: 42, right: 42, bottom: 42, left: 42 },
      animated: false,
    });
  }, [mapReady, routeData.mapCoordinates]);

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
          <Text style={styles.completedAt}>{copy.completedAt}: {formatCompletedAt(trip, language, copy.notAvailable)}</Text>

          <View style={styles.routeCard}>
            <Text style={styles.cardTitle}>{copy.routeTitle}</Text>
            {routeData.mapCoordinates.length >= 2 ? (
              <View style={styles.mapFrame}>
                <MapView
                  ref={mapRef}
                  initialRegion={getInitialRegion(routeData.mapCoordinates)}
                  loadingEnabled
                  onMapReady={() => setMapReady(true)}
                  style={styles.map}
                  toolbarEnabled={false}
                >
                  <Marker coordinate={routeData.origin} title={copy.origin} pinColor="#7C9820" />
                  <Marker coordinate={routeData.destination} title={copy.destination} pinColor={COLORS.ink} />
                  {routeData.routeCoordinates.length >= 2 ? (
                    <Polyline coordinates={routeData.routeCoordinates} strokeColor="#536A12" strokeWidth={5} />
                  ) : null}
                </MapView>
              </View>
            ) : null}
            {routeData.routeCoordinates.length < 2 ? (
              <Text style={styles.routeUnavailable}>{copy.routeUnavailable}</Text>
            ) : (
              <Text style={styles.routeSource}>
                {routeData.routeDataSource === 'client_demo' ? copy.routeSimulated : copy.routeRecorded}
              </Text>
            )}
            <RouteRow label={copy.origin} value={formatPlace(trip.pickupLocation, formatPlace(trip.origin, copy.notAvailable))} markerStyle={styles.originMarker} />
            <View style={styles.routeConnector} />
            <RouteRow label={copy.destination} value={formatPlace(trip.destinationLocation, formatPlace(trip.destination, copy.notAvailable))} markerStyle={styles.destinationMarker} />
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

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{copy.passengerRating}</Text>
            <Rating rating={trip.rating} copy={copy} />
          </View>

          <HistoryLink copy={copy} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function formatCompletedAt(trip, language, fallback) {
  const date = getCompletedAtDate(trip);
  return !date
    ? fallback
    : date.toLocaleString(language === 'en' ? 'en-US' : 'es-CO', { dateStyle: 'medium', timeStyle: 'short' });
}

function toCoordinate(value) {
  if (!value) return null;
  const latitude = Number(value.latitude ?? value.lat);
  const longitude = Number(value.longitude ?? value.lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
    || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude };
}

function getStoredRouteCoordinates(trip) {
  const candidates = [
    trip?.routeCoordinates,
    trip?.route?.coordinates,
    trip?.coordinates,
  ];
  const storedCoordinates = candidates.find((candidate) => Array.isArray(candidate)) ?? [];
  return storedCoordinates.map(toCoordinate).filter(Boolean);
}

function getRouteData(trip) {
  const routeCoordinates = getStoredRouteCoordinates(trip);
  const origin = toCoordinate(trip?.pickupLocation)
    ?? toCoordinate(trip?.originLocation)
    ?? toCoordinate(trip?.origin)
    ?? routeCoordinates[0];
  const destination = toCoordinate(trip?.destinationLocation)
    ?? toCoordinate(trip?.destination)
    ?? routeCoordinates[routeCoordinates.length - 1];
  const mapCoordinates = [...[origin, destination].filter(Boolean), ...routeCoordinates];

  return {
    origin,
    destination,
    mapCoordinates,
    routeCoordinates: origin && destination && routeCoordinates.length >= 2
      ? routeCoordinates
      : [],
    routeDataSource: trip?.routeDataSource ?? null,
  };
}

function getInitialRegion(coordinates) {
  const first = coordinates[0];
  return {
    latitude: first.latitude,
    longitude: first.longitude,
    latitudeDelta: 0.035,
    longitudeDelta: 0.035,
  };
}

function formatPlace(value, fallback) {
  if (typeof value === 'string') return value;
  return value?.address || fallback;
}

function Rating({ rating, copy }) {
  const numericRating = Number(rating);
  if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
    return <Text style={styles.routeUnavailable}>{copy.noRating}</Text>;
  }
  const roundedRating = Math.round(numericRating * 10) / 10;
  return (
    <View style={styles.ratingRow}>
      <Text style={styles.stars}>{'★'.repeat(Math.round(numericRating))}{'☆'.repeat(5 - Math.round(numericRating))}</Text>
      <Text style={styles.ratingValue}>{roundedRating.toFixed(1)} / 5</Text>
    </View>
  );
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
  mapFrame: { borderRadius: 14, height: 220, marginBottom: 14, marginTop: 10, overflow: 'hidden' },
  map: { height: '100%', width: '100%' },
  routeUnavailable: { color: COLORS.muted, fontSize: 11, lineHeight: 17, marginBottom: 12, marginTop: 8 },
  routeSource: { color: '#506518', fontSize: 10, fontWeight: '700', marginBottom: 12, marginTop: 8 },
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
  ratingRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 10, paddingTop: 8 },
  stars: { color: '#B38A1D', fontSize: 20, letterSpacing: 2 },
  ratingValue: { color: COLORS.ink, fontSize: 12, fontWeight: '800' },
  notFound: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  message: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 8 },
  backButton: { alignItems: 'center', backgroundColor: COLORS.ink, borderRadius: 14, justifyContent: 'center', marginTop: 18, minHeight: 52, paddingHorizontal: 14 },
  backButtonText: { color: COLORS.white, fontSize: 12, fontWeight: '800' },
  pressed: { opacity: 0.75 },
});
