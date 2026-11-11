import { StyleSheet, Text, View } from 'react-native';

const COLORS = {
  accent: '#B7D52B',
  ink: '#171914',
  muted: '#71766A',
  road: '#FFFFFF',
  surface: '#E7EBDD',
};

export default function DriverMapPreview({ copy, location }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{copy.mapTitle}</Text>
          <Text style={styles.location}>{location.label}</Text>
        </View>
        <Text style={styles.mapLabel}>{copy.mapLabel}</Text>
      </View>

      <View
        accessibilityLabel={`${copy.locationSource}: ${location.label}. ${copy.noGps}`}
        accessibilityRole="image"
        style={styles.map}
      >
        <View style={[styles.park, styles.parkOne]} />
        <View style={[styles.park, styles.parkTwo]} />
        <View style={[styles.road, styles.roadOne]} />
        <View style={[styles.road, styles.roadTwo]} />
        <View style={[styles.road, styles.roadThree]} />
        <View style={[styles.road, styles.roadFour]} />
        <View style={styles.streetLabelBox}>
          <Text style={styles.streetLabel}>AV. SAN JUAN</Text>
        </View>
        <View style={styles.markerHalo}>
          <View style={styles.marker}>
            <Text style={styles.markerText}>U</Text>
          </View>
        </View>
        <View style={styles.simulatedTag}>
          <View style={styles.simulatedDot} />
          <Text style={styles.simulatedText}>{copy.locationSource}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.coordinate}>{`${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}</Text>
        <Text style={styles.updated}>
          {`${copy.updated} ${location.lastUpdatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E7E9E3',
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 17,
    paddingVertical: 16,
  },
  title: { color: COLORS.ink, fontSize: 15, fontWeight: '800' },
  location: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  mapLabel: { color: COLORS.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1.1 },
  map: { backgroundColor: COLORS.surface, height: 238, overflow: 'hidden', position: 'relative' },
  park: { backgroundColor: '#D7E4C6', borderRadius: 14, position: 'absolute' },
  parkOne: { height: 90, left: -20, top: 8, transform: [{ rotate: '-12deg' }], width: 135 },
  parkTwo: { bottom: -16, height: 104, right: -12, transform: [{ rotate: '18deg' }], width: 150 },
  road: { backgroundColor: COLORS.road, borderColor: '#DDE1D5', borderWidth: 1, position: 'absolute' },
  roadOne: { height: 16, left: -30, top: 87, transform: [{ rotate: '-15deg' }], width: '120%' },
  roadTwo: { height: 13, left: -20, top: 170, transform: [{ rotate: '12deg' }], width: '120%' },
  roadThree: { height: 14, left: '34%', top: -20, transform: [{ rotate: '22deg' }], width: '120%' },
  roadFour: { height: 12, left: '-42%', top: 8, transform: [{ rotate: '-68deg' }], width: '120%' },
  streetLabelBox: { left: '12%', position: 'absolute', top: 126, transform: [{ rotate: '-15deg' }] },
  streetLabel: { color: '#7C8176', fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  markerHalo: {
    alignItems: 'center',
    backgroundColor: 'rgba(183, 213, 43, 0.3)',
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    left: '50%',
    marginLeft: -30,
    marginTop: -30,
    position: 'absolute',
    top: '50%',
    width: 60,
  },
  marker: {
    alignItems: 'center',
    backgroundColor: COLORS.ink,
    borderColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 3,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  markerText: { color: COLORS.accent, fontSize: 16, fontWeight: '900' },
  simulatedTag: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    bottom: 12,
    flexDirection: 'row',
    gap: 6,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    position: 'absolute',
  },
  simulatedDot: { backgroundColor: COLORS.accent, borderRadius: 4, height: 8, width: 8 },
  simulatedText: { color: COLORS.ink, fontSize: 10, fontWeight: '700' },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 17,
    paddingVertical: 13,
  },
  coordinate: { color: COLORS.muted, fontSize: 10, fontVariant: ['tabular-nums'] },
  updated: { color: COLORS.muted, fontSize: 10 },
});
