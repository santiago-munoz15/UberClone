import { useEffect, useMemo, useState } from 'react';
import * as Location from 'expo-location';
import { updateDriverLocation } from '../services/tripService';

const DEFAULT_LOCATION = Object.freeze({
  latitude: 6.2442,
  longitude: -75.5812,
  label: 'Ubicación no disponible',
  source: 'unavailable',
  lastUpdatedAt: new Date(0),
});

export default function useDriverLocation(enabled = false) {
  const [location, setLocation] = useState(DEFAULT_LOCATION);

  useEffect(() => {
    if (!enabled) return undefined;
    let isMounted = true;
    let subscription;

    async function startWatching() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!permission.granted) {
          throw new Error('LOCATION_PERMISSION_DENIED');
        }

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 10,
            timeInterval: 5000,
          },
          (position) => {
            const nextLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
              label: 'Ubicación actual',
              source: 'device',
              lastUpdatedAt: new Date(position.timestamp),
            };
            if (!isMounted) return;
            setLocation(nextLocation);
            updateDriverLocation(nextLocation).catch((error) => {
              console.error('No se pudo sincronizar la ubicación del conductor:', error);
            });
          },
        );
      } catch (error) {
        if (isMounted) {
          setLocation((current) => ({ ...current, source: 'unavailable' }));
        }
        console.error('No se pudo iniciar el seguimiento de ubicación:', error);
      }
    }

    startWatching();
    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, [enabled]);

  return useMemo(() => location, [location]);
}
