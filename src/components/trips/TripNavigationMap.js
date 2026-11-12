import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

const COPY = {
  es: {
    title: 'Navegación del viaje',
    pickupLeg: 'Ruta actual: punto de recogida',
    destinationLeg: 'Ruta actual: destino final',
    driver: 'Tu ubicación GPS',
    pickup: 'Punto de recogida',
    destination: 'Destino final',
    requesting: 'Solicitando permiso de ubicación…',
    locating: 'Esperando una posición GPS precisa…',
    permissionDenied: 'Permiso de ubicación denegado. Actívalo para ver tu posición y calcular la ruta.',
    gpsDisabled: 'La ubicación del dispositivo está desactivada. Activa el GPS para continuar.',
    locationError: 'No se pudo obtener la ubicación del dispositivo.',
    routeLoading: 'Calculando ruta por calles…',
    routeUnavailable: 'No hay una ruta disponible para este recorrido.',
    offline: 'Sin conexión. No se pudo cargar la ruta.',
    serviceError: 'El servicio de rutas no está disponible. Inténtalo nuevamente.',
    invalidCoordinates: 'Faltan coordenadas válidas para calcular esta ruta.',
    retryLocation: 'Reintentar ubicación',
    retryRoute: 'Reintentar ruta',
    attribution: '© OpenStreetMap contributors · Ruta: OSRM',
    accuracy: 'Ubicación GPS',
  },
  en: {
    title: 'Trip navigation',
    pickupLeg: 'Current route: pickup point',
    destinationLeg: 'Current route: final destination',
    driver: 'Your GPS location',
    pickup: 'Pickup point',
    destination: 'Final destination',
    requesting: 'Requesting location permission…',
    locating: 'Waiting for a precise GPS position…',
    permissionDenied: 'Location permission denied. Enable it to show your position and calculate the route.',
    gpsDisabled: 'Device location is disabled. Turn on GPS to continue.',
    locationError: 'Could not get the device location.',
    routeLoading: 'Calculating street route…',
    routeUnavailable: 'No route is available for this trip.',
    offline: 'No connection. The route could not be loaded.',
    serviceError: 'The routing service is unavailable. Try again.',
    invalidCoordinates: 'Valid coordinates are missing for this route.',
    retryLocation: 'Retry location',
    retryRoute: 'Retry route',
    attribution: '© OpenStreetMap contributors · Route: OSRM',
    accuracy: 'GPS location',
  },
};

function errorMessage(error, copy) {
  if (error === 'NETWORK_UNAVAILABLE') return copy.offline;
  if (error === 'NO_ROUTE_FOUND') return copy.routeUnavailable;
  if (error === 'INVALID_COORDINATES') return copy.invalidCoordinates;
  return copy.serviceError;
}

export default function TripNavigationMap({
  status,
  language = 'es',
  location,
  locationStatus,
  pickup,
  destination,
  route,
  routeStatus,
  routeError,
  deviceHeading,
  compassStatus,
  onRetryLocation,
  onRetryRoute,
}) {
  const mapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const lastFittedRouteId = useRef(null);
  const hasCenteredOnDriver = useRef(false);
  const lastAppliedHeading = useRef(null);
  const [followingHeading, setFollowingHeading] = useState(true);
  const copy = COPY[language] ?? COPY.es;
  const isPickupLeg = status === 'accepted' || status === 'arriving';
  const target = isPickupLeg ? pickup : destination;
  const center = location ?? target ?? pickup ?? destination;

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    if (route?.coordinates?.length >= 2 && route.id !== lastFittedRouteId.current) {
      const points = [
        ...(location ? [location] : []),
        ...route.coordinates,
        ...(target ? [target] : []),
      ];
      mapRef.current.fitToCoordinates(points, {
        edgePadding: { top: 54, right: 44, bottom: 72, left: 44 },
        animated: true,
      });
      lastFittedRouteId.current = route.id;
      hasCenteredOnDriver.current = true;
      return;
    }

    if (location && !hasCenteredOnDriver.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      }, 450);
      hasCenteredOnDriver.current = true;
    }
  }, [location, mapReady, route, target]);

  useEffect(() => {
    if (!mapReady || !followingHeading || compassStatus !== 'ready' || !Number.isFinite(deviceHeading?.degrees)) return;
    const previous = lastAppliedHeading.current;
    const difference = previous === null
      ? Infinity
      : Math.abs(((deviceHeading.degrees - previous + 540) % 360) - 180);
    if (difference < 4) return;
    mapRef.current?.animateCamera({ heading: deviceHeading.degrees }, { duration: 300 });
    lastAppliedHeading.current = deviceHeading.degrees;
  }, [compassStatus, deviceHeading, followingHeading, mapReady]);

  if (status === 'completed') return null;

  let locationMessage = null;
  if (locationStatus === 'requesting') locationMessage = copy.requesting;
  else if (locationStatus === 'locating') locationMessage = copy.locating;
  else if (locationStatus === 'permissionDenied') locationMessage = copy.permissionDenied;
  else if (locationStatus === 'gpsDisabled') locationMessage = copy.gpsDisabled;
  else if (locationStatus === 'locationError') locationMessage = copy.locationError;

  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <View style={styles.headingText}>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.activeLeg}>{isPickupLeg ? copy.pickupLeg : copy.destinationLeg}</Text>
        </View>
        <View style={[styles.gpsBadge, location ? styles.gpsBadgeReady : null]}>
          <View style={[styles.gpsDot, location ? styles.gpsDotReady : null]} />
          <Text style={styles.gpsBadgeText}>{location ? 'GPS' : '—'}</Text>
        </View>
      </View>

      {center ? (
        <View style={styles.mapFrame}>
          <MapView
            ref={mapRef}
            initialRegion={{
              latitude: center.latitude,
              longitude: center.longitude,
              latitudeDelta: 0.035,
              longitudeDelta: 0.035,
            }}
            loadingBackgroundColor="#E8ECDD"
            loadingEnabled
            onMapReady={() => setMapReady(true)}
            onPanDrag={() => setFollowingHeading(false)}
            onRegionChangeComplete={(_, details) => {
              if (details?.isGesture) setFollowingHeading(false);
            }}
            rotateEnabled
            showsCompass={false}
            showsMyLocationButton={false}
            style={styles.map}
            toolbarEnabled={false}
          >
            {location && (
              <Marker coordinate={location} title={copy.driver} description={copy.accuracy} pinColor="#2878D0" zIndex={3} />
            )}
            {pickup && <Marker coordinate={pickup} title={copy.pickup} pinColor="#829D22" zIndex={2} />}
            {destination && <Marker coordinate={destination} title={copy.destination} pinColor="#D88932" zIndex={2} />}
            {route?.coordinates?.length >= 2 && (
              <Polyline coordinates={route.coordinates} strokeColor="#536A12" strokeWidth={5} zIndex={2} />
            )}
          </MapView>
          <View pointerEvents="box-none" style={styles.mapControls}>
            <View style={styles.compassCard}>
              <View style={styles.compassFace}>
                <Text style={styles.compassNorth}>N</Text>
                <Text style={[styles.compassNeedle, compassStatus === 'ready' && styles.compassNeedleReady, { transform: [{ rotate: `${-(deviceHeading?.degrees ?? 0)}deg` }] }]}>▲</Text>
              </View>
              <Text style={styles.compassLabel}>
                {deviceHeading ? `${copy.phoneHeading} ${Math.round(deviceHeading.degrees)}°` : copy.compassUnavailable}
              </Text>
              {Number.isFinite(location?.heading) && location.heading >= 0 && (
                <Text style={styles.gpsCourse}>{`${copy.gpsCourse} ${Math.round(location.heading)}°`}</Text>
              )}
              {compassStatus === 'lowAccuracy' && <Text style={styles.compassWarning}>{copy.compassLowAccuracy}</Text>}
            </View>
            <View style={styles.compassButtons}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setFollowingHeading(false);
                  lastAppliedHeading.current = 0;
                  mapRef.current?.animateCamera({ heading: 0 }, { duration: 250 });
                }}
                style={styles.mapControlButton}
              >
                <Text style={styles.mapControlText}>{copy.resetNorth}</Text>
              </Pressable>
              {!followingHeading && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setFollowingHeading(true);
                    lastAppliedHeading.current = null;
                    const heading = compassStatus === 'ready' ? deviceHeading?.degrees : 0;
                    mapRef.current?.animateCamera({
                      ...(location ? { center: { latitude: location.latitude, longitude: location.longitude } } : {}),
                      heading: Number.isFinite(heading) ? heading : 0,
                    }, { duration: 300 });
                  }}
                  style={styles.mapControlButton}
                >
                  <Text style={styles.mapControlText}>{copy.followHeading}</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      ) : (
        <View style={[styles.map, styles.mapUnavailable]}>
          <Text style={styles.errorText}>{copy.invalidCoordinates}</Text>
        </View>
      )}

      <View style={styles.statusArea}>
        {locationMessage && <Text style={styles.statusText}>{locationMessage}</Text>}
        {locationStatus === 'permissionDenied' || locationStatus === 'gpsDisabled' || locationStatus === 'locationError' ? (
          <Pressable accessibilityRole="button" onPress={onRetryLocation} style={styles.retryButton}>
            <Text style={styles.retryText}>{copy.retryLocation}</Text>
          </Pressable>
        ) : null}
        {routeStatus === 'loading' && <Text style={styles.statusText}>{copy.routeLoading}</Text>}
        {routeStatus === 'error' && (
          <>
            <Text style={styles.errorText}>{errorMessage(routeError, copy)}</Text>
            {location && target && (
              <Pressable accessibilityRole="button" onPress={onRetryRoute} style={styles.retryButton}>
                <Text style={styles.retryText}>{copy.retryRoute}</Text>
              </Pressable>
            )}
          </>
        )}
      </View>
      <Text style={styles.attribution}>{copy.attribution}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, marginTop: 14, overflow: 'hidden', padding: 14 },
  heading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 11 },
  headingText: { flex: 1, paddingRight: 8 },
  title: { color: '#171914', fontSize: 13, fontWeight: '800' },
  activeLeg: { color: '#68705D', fontSize: 10, fontWeight: '600', marginTop: 3 },
  gpsBadge: { alignItems: 'center', backgroundColor: '#F1F2EE', borderRadius: 9, flexDirection: 'row', gap: 5, paddingHorizontal: 8, paddingVertical: 6 },
  gpsBadgeReady: { backgroundColor: '#EAF3E6' },
  gpsDot: { backgroundColor: '#9A9E92', borderRadius: 4, height: 7, width: 7 },
  gpsDotReady: { backgroundColor: '#4E852B' },
  gpsBadgeText: { color: '#596526', fontSize: 9, fontWeight: '900' },
  mapFrame: { height: 280, position: 'relative', width: '100%' },
  map: { borderRadius: 14, height: '100%', overflow: 'hidden', width: '100%' },
  mapControls: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', justifyContent: 'space-between', padding: 9 },
  compassCard: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 12, minWidth: 66, padding: 7 },
  compassFace: { alignItems: 'center', backgroundColor: '#F2F4ED', borderColor: '#D9DED0', borderRadius: 25, borderWidth: 1, height: 48, justifyContent: 'center', width: 48 },
  compassNorth: { color: '#A33C32', fontSize: 9, fontWeight: '900', position: 'absolute', top: 2 },
  compassNeedle: { color: '#969B8E', fontSize: 23, marginTop: 6 },
  compassNeedleReady: { color: '#B74336' },
  compassLabel: { color: '#34382F', fontSize: 8, fontWeight: '800', marginTop: 4 },
  gpsCourse: { color: '#62685B', fontSize: 7, marginTop: 2 },
  compassWarning: { color: '#9A5A18', fontSize: 7, fontWeight: '700', marginTop: 2 },
  compassButtons: { alignItems: 'flex-end', gap: 6 },
  mapControlButton: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 9, paddingHorizontal: 9, paddingVertical: 7 },
  mapControlText: { color: '#34382F', fontSize: 8, fontWeight: '800' },
  mapUnavailable: { alignItems: 'center', backgroundColor: '#F1F2EE', justifyContent: 'center', padding: 18 },
  statusArea: { gap: 7, paddingTop: 10 },
  statusText: { color: '#68705D', fontSize: 11, lineHeight: 16 },
  errorText: { color: '#9A3C2E', fontSize: 11, lineHeight: 16 },
  retryButton: { alignSelf: 'flex-start', backgroundColor: '#EFF3DE', borderRadius: 9, marginTop: 2, paddingHorizontal: 11, paddingVertical: 8 },
  retryText: { color: '#506518', fontSize: 10, fontWeight: '800' },
  attribution: { color: '#68705D', fontSize: 8, marginTop: 8, textAlign: 'right' },
});
