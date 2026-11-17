import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { transitionDriverTrip } from '../utils/transitionDriverTrip';
import { validatePickupProximity } from '../utils/pickupProximity';
import useTripLocation from '../hooks/useTripLocation';
import {
  createSimulatedTrip,
  appendTripRoutePoints,
  completeDriverTrip,
  completeSimulatedTrip,
  subscribeToDriverActiveTrips,
  subscribeToCompletedTrips,
  subscribeToIncomingTrips,
  subscribeToTrip,
  updateTrip,
  verifyTripDocument,
} from '../services/tripService';
import { useDriverAuth } from './DriverAuthContext';
import useDriverNotifications from '../hooks/useDriverNotifications';
import { isTerminalTripStatus } from '../utils/tripStatus';

const DriverTripContext = createContext(null);

function normalizeRemoteTrip(trip) {
  if (!trip) return trip;
  const status = {
    driver_arriving: 'arriving',
    onboard: 'onboard',
    in_progress: 'in_progress',
  }[trip.status] ?? trip.status;
  return { ...trip, status };
}

function isValidCoordinate(point) {
  return Number.isFinite(point?.latitude)
    && Number.isFinite(point?.longitude)
    && Math.abs(point.latitude) <= 90
    && Math.abs(point.longitude) <= 180;
}

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

function selectDemoRoutePoints(route) {
  const coordinates = route?.coordinates?.filter(isValidCoordinate) ?? [];
  if (coordinates.length < 5) return [];

  const selected = Array.from({ length: 5 }, (_, index) => (
    coordinates[Math.round((index * (coordinates.length - 1)) / 4)]
  ));
  return selected.filter((point, index) => (
    index === 0 || distanceBetween(selected[index - 1], point) > 0
  ));
}

function getValidRouteCoordinateCount(route) {
  return route?.coordinates?.filter(isValidCoordinate).length ?? 0;
}

export function DriverTripProvider({ children }) {
  const { user } = useDriverAuth();
  useDriverNotifications();
  const [activeTrip, setActiveTrip] = useState(null);
  const [completedTrips, setCompletedTrips] = useState([]);
  const [completedTripsSync, setCompletedTripsSync] = useState({ error: null, userId: null });
  const [incomingTrips, setIncomingTrips] = useState([]);
  const [tripError, setTripError] = useState(null);
  const tripSequence = useRef(0);
  const recordedTripIds = useRef(new Set());
  const isHydrated = Boolean(user && !user.isAnonymous);
  const activeTripId = activeTrip?.tripId;
  const activeTripIdRef = useRef(null);
  const activeTripUnsubscribeRef = useRef(null);
  const remoteTripStatusRef = useRef(null);
  const completedTripsLoading = Boolean(isHydrated && completedTripsSync.userId !== user.uid);
  const completedTripsError = completedTripsSync.userId === user?.uid
    ? completedTripsSync.error
    : null;
  const tripLocation = useTripLocation(
    Boolean(activeTrip && !isTerminalTripStatus(activeTrip.status)),
    activeTrip?.tripId,
  );
  const routeRecorderRef = useRef({
    tripId: null,
    lastPoint: null,
    lastWriteAt: 0,
    demoRecorded: false,
    lastError: null,
    writeChain: Promise.resolve(),
  });

  useEffect(() => {
    activeTripIdRef.current = activeTripId;
  }, [activeTripId]);

  useEffect(() => {
    const trip = activeTrip;
    if (!trip?.tripId
      || trip.status !== 'in_progress'
      || remoteTripStatusRef.current !== 'in_progress') return undefined;

    const recorder = routeRecorderRef.current;
    if (recorder.tripId !== trip.tripId) {
      const existingCoordinates = Array.isArray(trip.routeCoordinates) ? trip.routeCoordinates : [];
      recorder.tripId = trip.tripId;
      recorder.lastPoint = existingCoordinates[existingCoordinates.length - 1] ?? null;
      recorder.lastWriteAt = 0;
      recorder.demoRecorded = false;
      recorder.lastError = null;
      recorder.writeChain = Promise.resolve();
    }

    const queuePoints = (points, routeDataSource, force = false, minimumDistance = 15) => {
      const nextPoints = points.filter(isValidCoordinate).filter((point, index, list) => (
        (index === 0 || distanceBetween(list[index - 1], point) >= minimumDistance)
        && (!recorder.lastPoint || distanceBetween(recorder.lastPoint, point) >= minimumDistance)
      ));
      if (!nextPoints.length) return recorder.writeChain;

      recorder.lastPoint = nextPoints[nextPoints.length - 1];
      const now = Date.now();
      if (!force && recorder.lastWriteAt && now - recorder.lastWriteAt < 10_000) return;
      recorder.lastWriteAt = now;
      const writeOperation = recorder.writeChain
        .catch(() => {})
        .then(() => appendTripRoutePoints(trip.tripId, nextPoints, routeDataSource))
        .then(() => {
          recorder.lastError = null;
        }, (error) => {
          recorder.lastError = error;
          recorder.lastPoint = null;
          recorder.lastWriteAt = 0;
          console.error('No se pudo registrar el punto de ruta:', error);
          throw error;
        });
      writeOperation.catch(() => {});
      recorder.writeChain = writeOperation;
      return writeOperation;
    };

    if (trip.isSimulated && trip.demoDestinationArrival) {
      return undefined;
    }
    if (isValidCoordinate(tripLocation.location)) {
      queuePoints([tripLocation.location], 'device_gps');
    } else if (trip.isSimulated && trip.demoDestinationArrival && !recorder.demoRecorded) {
      recorder.demoRecorded = true;
      queuePoints([trip.pickupLocation, trip.destinationLocation], 'client_demo', true, 0);
    }

    return undefined;
  }, [
    activeTrip,
    tripLocation.location,
  ]);

  useEffect(() => {
    if (!activeTripId) {
      remoteTripStatusRef.current = null;
      activeTripUnsubscribeRef.current = null;
      return undefined;
    }
    let isCurrentSubscription = true;
    const unsubscribe = subscribeToTrip(
      activeTripId,
      (remoteTrip) => {
        if (!isCurrentSubscription || activeTripIdRef.current !== activeTripId) return;
        if (!remoteTrip) {
          remoteTripStatusRef.current = null;
          return;
        }
        const normalizedTrip = normalizeRemoteTrip(remoteTrip);
        remoteTripStatusRef.current = normalizedTrip.status;
        setActiveTrip((current) => current ? { ...current, ...normalizedTrip } : current);
      },
      (error) => {
        if (!isCurrentSubscription || activeTripIdRef.current !== activeTripId) return;
        setTripError(error);
        console.error('No se pudo sincronizar el viaje activo:', error);
      },
    );
    activeTripUnsubscribeRef.current = unsubscribe;
    return () => {
      isCurrentSubscription = false;
      unsubscribe();
      if (activeTripUnsubscribeRef.current === unsubscribe) {
        activeTripUnsubscribeRef.current = null;
      }
    };
  }, [activeTripId]);

  useEffect(() => {
    if (!user || user.isAnonymous) {
      return undefined;
    }

    const handleError = (error) => {
      setTripError(error);
      console.error('No se pudieron sincronizar los viajes del conductor:', error);
    };
    const handleCompletedTrips = (trips) => {
      const uniqueTrips = Array.from(
        new Map(trips.map((trip) => [trip.id, trip])).values(),
      );
      setCompletedTrips(uniqueTrips);
      setCompletedTripsSync({ error: null, userId: user.uid });
    };
    const handleCompletedTripsError = (error) => {
      setCompletedTrips([]);
      setCompletedTripsSync({ error, userId: user.uid });
      handleError(error);
    };
    const unsubscribeIncoming = subscribeToIncomingTrips(setIncomingTrips, handleError);
    const unsubscribeCompleted = subscribeToCompletedTrips(handleCompletedTrips, handleCompletedTripsError);
    const unsubscribeActive = subscribeToDriverActiveTrips((trips) => {
      if (!trips.length) return;
      setActiveTrip((current) => current?.isSimulated === true ? current : normalizeRemoteTrip(trips[0]));
    }, handleError);

    return () => {
      unsubscribeIncoming();
      unsubscribeCompleted();
      unsubscribeActive();
    };
  }, [user]);

  const startTrip = useCallback(async (request) => {
    if (!isHydrated || !request?.id || request.status !== 'accepted') return false;
    if (activeTrip && !isTerminalTripStatus(activeTrip.status)) return false;

    tripSequence.current += 1;
    const persistedSimulatedTrip = request.isSimulated
      && incomingTrips.some((item) => item.id === request.id);
    const trip = {
      ...request,
      tripId: request.isSimulated && !persistedSimulatedTrip
        ? request.id ?? `trip-${Date.now()}-${tripSequence.current}`
        : request.id,
      isSimulated: request.isSimulated === true,
      language: request.language === 'en' ? 'en' : 'es',
      paymentMethod: request.paymentMethod,
      paymentStatus: request.paymentStatus
        ?? (request.paymentMethod === 'cash' || request.paymentMethod === 'Efectivo' ? 'cash' : 'pending'),
    };

    try {
      if (trip.isSimulated) {
        if (persistedSimulatedTrip) {
          await updateTrip(trip.tripId, {
            status: 'accepted',
          });
        } else {
          await createSimulatedTrip(trip);
        }
      } else {
        await verifyTripDocument(trip.tripId);
        await updateTrip(trip.tripId, { status: 'accepted' });
      }
    } catch (error) {
      console.error('No se pudo crear o aceptar el viaje:', error);
      return false;
    }

    setActiveTrip(trip);
    return true;
  }, [activeTrip, incomingTrips, isHydrated]);

  const transitionActiveTrip = useCallback(async (nextStatus) => {
    const current = activeTrip;
    if (!current) return false;
    const nextTrip = transitionDriverTrip(current, nextStatus, {
      currentLocation: tripLocation.status === 'ready' ? tripLocation.location : null,
    });
    if (nextTrip === current) return false;

    const remoteStatus = {
      arriving: 'driver_arriving',
      onboard: 'onboard',
      in_progress: 'in_progress',
      completed: 'completed',
    }[nextStatus] ?? nextStatus;
    try {
      await updateTrip(current.tripId, { status: remoteStatus });
    } catch (error) {
      setTripError(error);
      console.error('No se pudo actualizar el estado del viaje:', error);
      return false;
    }

    remoteTripStatusRef.current = remoteStatus === 'driver_arriving' ? 'arriving' : remoteStatus;
    setActiveTrip((latestTrip) => (
      latestTrip?.tripId === current.tripId ? nextTrip : latestTrip
    ));
    return true;
  }, [activeTrip, tripLocation.location, tripLocation.status]);

  const clearActiveTrip = useCallback(() => {
    activeTripIdRef.current = null;
    activeTripUnsubscribeRef.current?.();
    activeTripUnsubscribeRef.current = null;
    remoteTripStatusRef.current = null;
    routeRecorderRef.current = {
      tripId: null,
      lastPoint: null,
      lastWriteAt: 0,
      demoRecorded: false,
      lastError: null,
      writeChain: Promise.resolve(),
    };
    setActiveTrip(null);
    setTripError(null);
  }, []);

  const simulateDestinationArrival = useCallback(async (route) => {
    const current = activeTrip;
    if (current?.status !== 'in_progress' || !current.isSimulated
      || remoteTripStatusRef.current !== 'in_progress') return false;

    const validCoordinateCount = getValidRouteCoordinateCount(route);
    if (!validCoordinateCount) {
      setTripError(new Error('DEMO_ROUTE_UNAVAILABLE'));
      return false;
    }
    const demoPoints = selectDemoRoutePoints(route);
    if (validCoordinateCount < 5 || demoPoints.length < 5) {
      setTripError(new Error('DEMO_ROUTE_TOO_SHORT'));
      return false;
    }

    const recorder = routeRecorderRef.current;
    if (recorder.tripId !== current.tripId) {
      recorder.tripId = current.tripId;
      recorder.lastPoint = null;
      recorder.lastWriteAt = 0;
      recorder.demoRecorded = false;
      recorder.lastError = null;
      recorder.writeChain = Promise.resolve();
    }
    recorder.demoRecorded = true;
    const queuedWrite = recorder.writeChain
      .catch(() => {})
      .then(() => appendTripRoutePoints(current.tripId, demoPoints, 'client_demo'))
      .then(() => {
        recorder.lastPoint = demoPoints[demoPoints.length - 1];
        recorder.lastError = null;
      }, (error) => {
        recorder.lastError = error;
        console.error('No se pudo registrar la ruta simulada:', error);
        throw error;
      });
    queuedWrite.catch(() => {});
    recorder.writeChain = queuedWrite;

    try {
      await queuedWrite;
    } catch (error) {
      setTripError(error);
      return false;
    }

    setActiveTrip((latestTrip) => (
      latestTrip?.tripId === current.tripId
        ? { ...latestTrip, demoDestinationArrival: true }
        : latestTrip
    ));
    setTripError(null);
    return true;
  }, [activeTrip]);

  const simulatePickupArrival = useCallback(() => {
    setActiveTrip((current) => {
      if (current?.status !== 'arriving' || !current.isSimulated || !current.pickupLocation) return current;
      const nextTrip = transitionDriverTrip(current, 'onboard', {
        currentLocation: {
          ...current.pickupLocation,
          accuracy: 5,
          timestamp: Date.now(),
        },
      });
      if (nextTrip !== current) {
        updateTrip(current.tripId, { status: 'onboard' }).catch((error) => {
          console.error('No se pudo sincronizar la llegada simulada:', error);
        });
      }
      return nextTrip;
    });
  }, []);

  const completeActiveTrip = useCallback(async () => {
    if (activeTrip?.status !== 'in_progress' || recordedTripIds.current.has(activeTrip.tripId)) return false;

    const currentLocation = activeTrip.demoDestinationArrival && activeTrip.isSimulated
      ? { ...activeTrip.destinationLocation, accuracy: 5, timestamp: Date.now() }
      : tripLocation.status === 'ready' ? tripLocation.location : null;
    if (!validatePickupProximity(currentLocation, activeTrip.destinationLocation).allowed) return false;

    try {
      await routeRecorderRef.current.writeChain;
      if (routeRecorderRef.current.lastError) {
        throw routeRecorderRef.current.lastError;
      }
      if (!routeRecorderRef.current.lastPoint) {
        throw new Error('No se pudo registrar la ruta recorrida antes de finalizar el viaje.');
      }
      await verifyTripDocument(activeTrip.tripId);
    } catch (error) {
      setTripError(error);
      console.error('No se pudo verificar el viaje antes de completarlo:', error);
      return false;
    }

    let completion;
    try {
      completion = activeTrip.isSimulated
        ? await completeSimulatedTrip(activeTrip.tripId)
        : await completeDriverTrip(activeTrip.tripId, currentLocation);
    } catch (error) {
      setTripError(error);
      console.error('No se pudo completar el viaje de forma segura:', error);
      return false;
    }

    const completedTrip = {
      ...activeTrip,
      ...completion,
      requestId: activeTrip.id,
      id: activeTrip.tripId,
    };
    recordedTripIds.current.add(activeTrip.tripId);
    setActiveTrip((current) => current ? { ...current, ...completion } : current);
    setTripError(null);
    setCompletedTrips((current) => (
      current.some((trip) => trip.id === completedTrip.id) ? current : [completedTrip, ...current]
    ));
    return true;
  }, [activeTrip, tripLocation.location, tripLocation.status]);

  const value = useMemo(
    () => ({ activeTrip, completedTrips, completedTripsLoading, completedTripsError, incomingTrips, tripError, isHydrated, tripLocation, startTrip, transitionActiveTrip, simulatePickupArrival, simulateDestinationArrival, completeActiveTrip, clearActiveTrip }),
    [activeTrip, completedTrips, completedTripsLoading, completedTripsError, incomingTrips, tripError, isHydrated, tripLocation, startTrip, transitionActiveTrip, simulatePickupArrival, simulateDestinationArrival, completeActiveTrip, clearActiveTrip],
  );

  return <DriverTripContext.Provider value={value}>{children}</DriverTripContext.Provider>;
}

export function useDriverTrip() {
  const context = useContext(DriverTripContext);
  if (!context) {
    throw new Error('useDriverTrip debe usarse dentro de DriverTripProvider.');
  }
  return context;
}
