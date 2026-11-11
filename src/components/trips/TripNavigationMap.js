import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getTripRouteGeometry } from '../../utils/routeGeometry';

const COLORS = {
  background: '#E8ECDD',
  road: '#FFFFFF',
  roadEdge: '#D5DCCB',
  route: '#536A12',
  driver: '#171914',
  pickup: '#B7D52B',
  destination: '#D88932',
  muted: '#68705D',
};

const LABELS = {
  es: { title: 'Navegación simulada', driver: 'CONDUCTOR', pickup: 'RECOGIDA', destination: 'DESTINO', toPickup: 'Ruta al punto de recogida', toDestination: 'Ruta al destino' },
  en: { title: 'Simulated navigation', driver: 'DRIVER', pickup: 'PICKUP', destination: 'DESTINATION', toPickup: 'Route to pickup', toDestination: 'Route to destination' },
};

export default function TripNavigationMap({ status, coordinates, language = 'es' }) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const labels = LABELS[language] ?? LABELS.es;
  const geometry = getTripRouteGeometry(status, size, coordinates);
  const isPickupLeg = status === 'accepted' || status === 'arriving';

  const handleLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((current) => (current.width === width && current.height === height ? current : { width, height }));
  };

  if (status === 'completed') return null;

  return (
    <View accessibilityLabel={labels.title} style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{labels.title}</Text>
          <Text style={styles.activeLeg}>{isPickupLeg ? labels.toPickup : labels.toDestination}</Text>
        </View>
        <View style={styles.badge}><Text style={styles.badgeText}>SIM</Text></View>
      </View>

      <View onLayout={handleLayout} style={styles.canvas}>
        <View pointerEvents="none" style={[styles.road, styles.roadOne]} />
        <View pointerEvents="none" style={[styles.road, styles.roadTwo]} />
        <View pointerEvents="none" style={[styles.road, styles.roadThree]} />
        <View pointerEvents="none" style={[styles.park, styles.parkOne]} />
        <View pointerEvents="none" style={[styles.park, styles.parkTwo]} />
        {geometry.segments.map((segment) => (
          <View
            key={segment.key}
            pointerEvents="none"
            style={[styles.routeLine, { left: segment.left, top: segment.top - 2, width: segment.length, transform: [{ rotate: segment.angle }] }]}
          />
        ))}
        {geometry.markers.map((marker) => {
          const label = marker.kind === 'driver' ? labels.driver : marker.kind === 'pickup' ? labels.pickup : labels.destination;
          return (
            <View key={marker.key} style={[styles.markerWrap, { left: marker.left, top: marker.top }]}>
              <View style={[styles.marker, marker.kind === 'driver' ? styles.driverMarker : marker.kind === 'pickup' ? styles.pickupMarker : styles.destinationMarker]}>
                {marker.kind === 'driver' && <View style={styles.driverCore} />}
              </View>
              <Text style={styles.markerLabel}>{label}</Text>
            </View>
          );
        })}
        <Text style={styles.mapCaption}>COORDENADAS FICTICIAS · SIN GPS</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, marginTop: 14, overflow: 'hidden', padding: 14 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  title: { color: '#171914', fontSize: 13, fontWeight: '800' },
  activeLeg: { color: COLORS.muted, fontSize: 10, fontWeight: '600', marginTop: 3 },
  badge: { backgroundColor: '#EFF3DE', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  badgeText: { color: '#596526', fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  canvas: { backgroundColor: COLORS.background, borderRadius: 14, height: 224, overflow: 'hidden', position: 'relative' },
  road: { backgroundColor: COLORS.road, borderColor: COLORS.roadEdge, borderRadius: 8, borderWidth: 1, position: 'absolute' },
  roadOne: { height: 15, left: '-10%', top: '69%', transform: [{ rotate: '-1deg' }], width: '125%' },
  roadTwo: { height: 15, left: '24%', top: '30%', transform: [{ rotate: '90deg' }], width: '64%' },
  roadThree: { height: 15, left: '48%', top: '18%', transform: [{ rotate: '0deg' }], width: '62%' },
  park: { backgroundColor: '#D6E2C2', borderRadius: 12, position: 'absolute' },
  parkOne: { height: 40, left: '4%', top: '12%', width: '22%' },
  parkTwo: { height: 34, left: '70%', top: '70%', width: '24%' },
  routeLine: { backgroundColor: COLORS.route, height: 5, position: 'absolute' },
  markerWrap: { alignItems: 'center', marginLeft: -8, marginTop: -8, position: 'absolute', zIndex: 2 },
  marker: { alignItems: 'center', borderColor: '#FFFFFF', borderRadius: 12, borderWidth: 2, height: 20, justifyContent: 'center', width: 20 },
  driverMarker: { backgroundColor: COLORS.driver },
  driverCore: { backgroundColor: '#FFFFFF', borderRadius: 3, height: 6, width: 6 },
  pickupMarker: { backgroundColor: COLORS.pickup },
  destinationMarker: { backgroundColor: COLORS.destination, borderRadius: 5 },
  markerLabel: { backgroundColor: '#FFFFFF', borderRadius: 5, color: '#33372E', fontSize: 7, fontWeight: '900', marginTop: 3, overflow: 'hidden', paddingHorizontal: 4, paddingVertical: 2 },
  mapCaption: { bottom: 8, color: '#657055', fontSize: 7, fontWeight: '800', letterSpacing: 0.4, position: 'absolute', right: 9 },
});
