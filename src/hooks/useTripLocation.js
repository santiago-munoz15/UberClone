import { AppState } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

export default function useTripLocation(enabled, tripKey) {
  const [result, setResult] = useState({ tripKey: null, location: null, status: 'idle' });
  const [compassResult, setCompassResult] = useState({ tripKey: null, heading: null, status: 'idle' });
  const [retryCount, setRetryCount] = useState(0);
  const statusRef = useRef('idle');
  const lastCompassUpdateRef = useRef({ degrees: null, at: 0, status: 'idle' });

  useEffect(() => {
    statusRef.current = result.status;
  }, [result.status]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let isMounted = true;
    let subscription = null;
    let headingSubscription = null;
    lastCompassUpdateRef.current = { degrees: null, at: 0, status: 'idle' };

    async function startHeadingWatching() {
      try {
        const nextHeadingSubscription = await Location.watchHeadingAsync(
          (reading) => {
            if (!isMounted) return;
            const magneticDegrees = reading?.magHeading;
            const trueDegrees = reading?.trueHeading;
            const rawDegrees = Number.isFinite(trueDegrees) && trueDegrees >= 0
              ? trueDegrees
              : magneticDegrees;
            const accuracy = reading?.accuracy;
            if (!Number.isFinite(rawDegrees) || rawDegrees < 0 || rawDegrees > 360) {
              setCompassResult({ tripKey, heading: null, status: 'unavailable' });
              return;
            }

            const degrees = rawDegrees % 360;
            const status = Number.isFinite(accuracy) && accuracy >= 2 ? 'ready' : 'lowAccuracy';
            const now = Date.now();
            const previous = lastCompassUpdateRef.current;
            const difference = previous.degrees === null
              ? Infinity
              : Math.abs(((degrees - previous.degrees + 540) % 360) - 180);
            if (status === previous.status && (
              now - previous.at < 150
              || (difference < 2 && now - previous.at < 400)
            )) return;

            lastCompassUpdateRef.current = { degrees, at: now, status };
            setCompassResult({
              tripKey,
              heading: { degrees, magneticDegrees, trueDegrees, accuracy },
              status,
            });
          },
          () => {
            if (isMounted) setCompassResult({ tripKey, heading: null, status: 'unavailable' });
          },
        );
        if (!isMounted) {
          nextHeadingSubscription.remove();
          return;
        }
        headingSubscription = nextHeadingSubscription;
      } catch {
        if (isMounted) setCompassResult({ tripKey, heading: null, status: 'unavailable' });
      }
    }

    startHeadingWatching();
    const appStateSubscription = AppState.addEventListener('change', async (appState) => {
      if (appState !== 'active') return;
      const servicesEnabled = await Location.hasServicesEnabledAsync().catch(() => true);
      if (!isMounted) return;
      if (!servicesEnabled) {
        subscription?.remove();
        subscription = null;
        setResult({ tripKey, location: null, status: 'gpsDisabled' });
      } else if (statusRef.current === 'gpsDisabled') {
        setRetryCount((current) => current + 1);
      }
    });
    async function startWatching() {
      try {
        await Promise.resolve();
        if (!isMounted) return;
        setResult({ tripKey, location: null, status: 'requesting' });
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!isMounted) return;
        if (!permission.granted) {
          setResult({ tripKey, location: null, status: 'permissionDenied' });
          return;
        }

        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!isMounted) return;
        if (!servicesEnabled) {
          setResult({ tripKey, location: null, status: 'gpsDisabled' });
          return;
        }

        setResult({ tripKey, location: null, status: 'locating' });
        const nextSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 5,
            timeInterval: 1000,
          },
          (position) => {
            if (!isMounted) return;
            setResult({
              tripKey,
              location: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                heading: position.coords.heading,
                timestamp: position.timestamp,
              },
              status: 'ready',
            });
          },
          () => {
            if (isMounted) setResult({ tripKey, location: null, status: 'locationError' });
          },
        );

        if (!isMounted) {
          nextSubscription.remove();
          return;
        }
        subscription = nextSubscription;
      } catch (error) {
        if (!isMounted) return;
        const servicesEnabled = await Location.hasServicesEnabledAsync().catch(() => true);
        if (!servicesEnabled) setResult({ tripKey, location: null, status: 'gpsDisabled' });
        else setResult({ tripKey, location: null, status: error?.code === 'E_LOCATION_SERVICES_DISABLED' ? 'gpsDisabled' : 'locationError' });
      }
    }

    startWatching();

    return () => {
      isMounted = false;
      subscription?.remove();
      headingSubscription?.remove();
      appStateSubscription.remove();
    };
  }, [enabled, retryCount, tripKey]);

  const retry = useCallback(() => setRetryCount((current) => current + 1), []);

  const matchesTrip = enabled && result.tripKey === tripKey;
  return {
    location: matchesTrip ? result.location : null,
    status: !enabled ? 'idle' : matchesTrip ? result.status : 'requesting',
    deviceHeading: enabled && compassResult.tripKey === tripKey ? compassResult.heading : null,
    compassStatus: !enabled ? 'idle' : compassResult.tripKey === tripKey ? compassResult.status : 'loading',
    retry,
  };
}
