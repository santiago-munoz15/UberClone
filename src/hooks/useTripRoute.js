import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchDrivingRoute } from '../services/osrmRouteService';

const MIN_REROUTE_DISTANCE_METERS = 50;

function distanceBetween(first, second) {
  if (!first || !second) return Infinity;
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(second.latitude - first.latitude);
  const longitudeDelta = radians(second.longitude - first.longitude);
  const firstLatitude = radians(first.latitude);
  const secondLatitude = radians(second.latitude);
  const value = (Math.sin(latitudeDelta / 2) ** 2)
    + Math.cos(firstLatitude) * Math.cos(secondLatitude) * (Math.sin(longitudeDelta / 2) ** 2);
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function getActiveLeg(status) {
  if (status === 'accepted' || status === 'arriving') return 'pickup';
  if (status === 'in_progress') return 'destination';
  return null;
}

export default function useTripRoute({ status, location, pickup, destination }) {
  const [result, setResult] = useState({ leg: null, route: null, status: 'idle', error: null });
  const [refreshCount, setRefreshCount] = useState(0);
  const controllerRef = useRef(null);
  const lastRequestOriginRef = useRef(null);
  const lastLegRef = useRef(null);
  const latestLocationRef = useRef(location);
  const retryTimerRef = useRef(null);

  useEffect(() => {
    latestLocationRef.current = location;
  }, [location]);

  const leg = getActiveLeg(status);
  const target = leg === 'pickup' ? pickup : leg === 'destination' ? destination : null;

  useEffect(() => {
    if (!leg || !location || !target) {
      if (!leg) {
        controllerRef.current?.abort();
        controllerRef.current = null;
        lastLegRef.current = null;
        lastRequestOriginRef.current = null;
      }
      return undefined;
    }

    const legChanged = lastLegRef.current !== leg;
    const movedEnough = distanceBetween(lastRequestOriginRef.current, location) >= MIN_REROUTE_DISTANCE_METERS;
    if (!legChanged && !movedEnough && lastRequestOriginRef.current) return undefined;

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    lastLegRef.current = leg;
    lastRequestOriginRef.current = location;

    Promise.resolve()
      .then(() => {
        if (controller.signal.aborted) return null;
        setResult({ leg, route: null, status: 'loading', error: null });
        return fetchDrivingRoute(location, target, controller.signal);
      })
      .then((nextRoute) => {
        if (controller.signal.aborted || !nextRoute) return;
        setResult({
          leg,
          route: { ...nextRoute, leg, requestedFrom: location, id: `${leg}-${Date.now()}` },
          status: 'ready',
          error: null,
        });
      })
      .catch((requestError) => {
        if (controller.signal.aborted || requestError?.name === 'AbortError') return;
        setResult({ leg, route: null, status: 'error', error: requestError?.message ?? 'ROUTE_SERVICE_UNAVAILABLE' });
      })
      .finally(() => {
        if (controllerRef.current === controller) controllerRef.current = null;
        if (controller.signal.aborted) return;
        if (distanceBetween(lastRequestOriginRef.current, latestLocationRef.current) >= MIN_REROUTE_DISTANCE_METERS) {
          retryTimerRef.current = setTimeout(() => setRefreshCount((current) => current + 1), 1100);
        }
      });

    return undefined;
  }, [leg, location, target, refreshCount]);

  useEffect(() => () => {
    controllerRef.current?.abort();
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
  }, []);

  const retry = useCallback(() => {
    lastRequestOriginRef.current = null;
    setRefreshCount((current) => current + 1);
  }, []);

  const currentResult = result.leg === leg ? result : null;
  return {
    route: currentResult?.route ?? null,
    status: !leg || !location ? 'idle' : currentResult?.status ?? 'loading',
    error: currentResult?.error ?? null,
    retry,
  };
}
