import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Location from 'expo-location';
import { updateDriverLocation } from '../services/tripService';

const EMPTY_LOCATION = Object.freeze({
  latitude: null,
  longitude: null,
  accuracy: null,
  timestamp: null,
  source: 'unavailable',
  status: 'disabled',
  lastUpdatedAt: null,
  sessionKey: null,
});

export default function useDriverLocation(enabled = false) {
  const [location, setLocation] = useState(EMPTY_LOCATION);
  const [retryCount, setRetryCount] = useState(0);
  const sessionKey = `${enabled}:${retryCount}`;

  useEffect(() => {
    if (!enabled) return undefined;

    let isMounted = true;
    let subscription;
    let noFixTimeout;

    const setUnavailableStatus = (status) => {
      if (!isMounted) return;
      setLocation({ ...EMPTY_LOCATION, status, sessionKey });
    };
    const monitorForLocationUpdates = () => {
      clearTimeout(noFixTimeout);
      noFixTimeout = setTimeout(() => {
        setLocation((current) => (
          current.source === 'device' && Date.now() - current.timestamp < 15000
            ? current
            : { ...EMPTY_LOCATION, status: 'locationError', sessionKey }
        ));
      }, 15000);
    };

    async function startWatching() {
      setUnavailableStatus('requesting');
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!isMounted) return;
        if (!permission.granted) {
          setUnavailableStatus('permissionDenied');
          return;
        }

        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!isMounted) return;
        if (!servicesEnabled) {
          setUnavailableStatus('gpsDisabled');
          return;
        }

        setUnavailableStatus('locating');
        monitorForLocationUpdates();

        const nextSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 10,
            timeInterval: 5000,
          },
          (position) => {
            if (!isMounted) return;
            monitorForLocationUpdates();
            const nextLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
              source: 'device',
              status: 'device',
              lastUpdatedAt: new Date(position.timestamp),
              sessionKey,
            };
            setLocation(nextLocation);
            updateDriverLocation(nextLocation).catch((error) => {
              console.error('No se pudo sincronizar la ubicación del conductor:', error);
            });
          },
          () => {
            clearTimeout(noFixTimeout);
            setUnavailableStatus('locationError');
          },
        );

        if (!isMounted) {
          nextSubscription.remove();
          return;
        }
        subscription = nextSubscription;
      } catch (error) {
        setUnavailableStatus(error?.code === 'E_LOCATION_SERVICES_DISABLED' ? 'gpsDisabled' : 'locationError');
        console.error('No se pudo iniciar el seguimiento de ubicación:', error);
      }
    }

    startWatching();
    return () => {
      isMounted = false;
      clearTimeout(noFixTimeout);
      subscription?.remove();
    };
  }, [enabled, retryCount, sessionKey]);

  const retry = useCallback(() => setRetryCount((count) => count + 1), []);
  return useMemo(() => ({
    ...(location.sessionKey === sessionKey
      ? location
      : { ...EMPTY_LOCATION, status: enabled ? 'requesting' : 'disabled', sessionKey }),
    retry,
  }), [enabled, location, retry, sessionKey]);
}
