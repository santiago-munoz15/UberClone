import MapView, { Marker } from 'react-native-maps';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const COLORS = {
  accent: '#B7D52B',
  ink: '#171914',
  muted: '#71766A',
  surface: '#E7EBDD',
  white: '#FFFFFF',
};

function hasDeviceLocation(location) {
  return location?.source === 'device'
    && location.status === 'device'
    && Number.isFinite(location.latitude)
    && Number.isFinite(location.longitude);
}

export default function DriverMapPreview({ copy, language, location }) {
  const hasLocation = hasDeviceLocation(location);
  const retryable = ['permissionDenied', 'gpsDisabled', 'locationError'].includes(location.status);
  const coordinates = hasLocation
    ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
    : null;
  const time = hasLocation && location.lastUpdatedAt
    ? new Date(location.lastUpdatedAt).toLocaleTimeString(language === 'en' ? 'en-US' : 'es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    })
    : null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.locationIcon}><Text style={styles.locationIconText}>⌖</Text></View>
        <View style={styles.heading}>
          <Text style={styles.title}>{hasLocation ? copy.mapTitle : copy.mapWaitingTitle}</Text>
          {hasLocation ? <Text style={styles.location}>{copy.locationReady}</Text> : null}
        </View>
        <View style={[styles.mapLabelPill, hasLocation && styles.mapLabelPillLive]}>
          <View style={[styles.statusDot, hasLocation && styles.statusDotLive]} />
          <Text style={styles.mapLabel}>{hasLocation ? copy.mapLabel : copy.unavailable}</Text>
        </View>
      </View>

      {hasLocation ? (
        <MapView
          region={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          loadingBackgroundColor={COLORS.surface}
          loadingEnabled
          showsCompass
          showsMyLocationButton={false}
          style={styles.map}
          toolbarEnabled={false}
        >
          <Marker
            coordinate={{ latitude: location.latitude, longitude: location.longitude }}
            title={copy.mapTitle}
            description={copy.updated}
            pinColor="#2878D0"
          />
        </MapView>
      ) : (
        <View style={[styles.map, styles.mapUnavailable]}>
          <View style={styles.unavailableIcon}><Text style={styles.unavailableIconText}>⌖</Text></View>
          <Text style={styles.unavailableMessage}>{copy.locationMessages[location.status]}</Text>
          {retryable ? (
            <Pressable accessibilityRole="button" onPress={location.retry} style={styles.retryButton}>
              <Text style={styles.retryText}>{copy.retryLocation}</Text>
            </Pressable>
          ) : null}
        </View>
      )}

      <View style={styles.footer}>
        {hasLocation ? (
          <>
            <Text style={styles.coordinate}>{coordinates}</Text>
            <Text style={styles.updated}>{`${copy.updated}: ${time}`}</Text>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderColor: '#E7E9E3',
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: { alignItems: 'center', flexDirection: 'row', paddingHorizontal: 17, paddingVertical: 16 },
  locationIcon: { alignItems: 'center', backgroundColor: '#EFF3DE', borderRadius: 16, height: 34, justifyContent: 'center', marginRight: 10, width: 34 },
  locationIconText: { color: '#596526', fontSize: 22, fontWeight: '700' },
  heading: { flex: 1 },
  title: { color: COLORS.ink, fontSize: 15, fontWeight: '800' },
  location: { color: COLORS.muted, fontSize: 10, marginTop: 4 },
  mapLabelPill: { alignItems: 'center', backgroundColor: '#F0F1ED', borderRadius: 16, flexDirection: 'row', gap: 5, marginLeft: 8, paddingHorizontal: 9, paddingVertical: 7 },
  mapLabelPillLive: { backgroundColor: '#EFF8C9' },
  statusDot: { backgroundColor: '#969A90', borderRadius: 4, height: 7, width: 7 },
  statusDotLive: { backgroundColor: '#4F9B62' },
  mapLabel: { color: '#596526', fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  map: { backgroundColor: COLORS.surface, height: 210, width: '100%' },
  mapUnavailable: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  unavailableIcon: { alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 24, height: 48, justifyContent: 'center', width: 48 },
  unavailableIconText: { color: '#7C8176', fontSize: 30 },
  unavailableMessage: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 12, maxWidth: 270, textAlign: 'center' },
  retryButton: { backgroundColor: '#EFF3DE', borderRadius: 12, marginTop: 12, paddingHorizontal: 14, paddingVertical: 9 },
  retryText: { color: '#596526', fontSize: 11, fontWeight: '800' },
  footer: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 43, paddingHorizontal: 17, paddingVertical: 11 },
  coordinate: { color: COLORS.muted, fontSize: 10, fontVariant: ['tabular-nums'] },
  updated: { color: COLORS.muted, fontSize: 10 },
});
