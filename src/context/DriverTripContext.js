import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { transitionDriverTrip } from '../utils/transitionDriverTrip';
import { validatePickupProximity } from '../utils/pickupProximity';
import useTripLocation from '../hooks/useTripLocation';
import {
  createSimulatedTrip,
  completeDriverTrip,
  subscribeToDriverActiveTrips,
  subscribeToCompletedTrips,
  subscribeToIncomingTrips,
  subscribeToTrip,
  updateTrip,
  verifyTripDocument,
} from '../services/tripService';
import { useDriverAuth } from './DriverAuthContext';
import useDriverNotifications from '../hooks/useDriverNotifications';

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
  const completedTripsLoading = Boolean(isHydrated && completedTripsSync.userId !== user.uid);
  const completedTripsError = completedTripsSync.userId === user?.uid
    ? completedTripsSync.error
    : null;
  const tripLocation = useTripLocation(
    Boolean(activeTrip && activeTrip.status !== 'completed' && activeTrip.status !== 'paid'),
    activeTrip?.tripId,
  );

  useEffect(() => {
    if (!activeTripId) return undefined;
    const unsubscribe = subscribeToTrip(
      activeTripId,
      (remoteTrip) => {
        if (!remoteTrip) return;
        const normalizedTrip = normalizeRemoteTrip(remoteTrip);
        setActiveTrip((current) => current ? { ...current, ...normalizedTrip } : current);
      },
      (error) => {
        setTripError(error);
        console.error('No se pudo sincronizar el viaje activo:', error);
      },
    );
    return unsubscribe;
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
    if (activeTrip && activeTrip.status !== 'completed') return false;

    tripSequence.current += 1;
    const trip = {
      ...request,
      tripId: request.isSimulated
        ? request.tripId ?? request.id ?? `trip-${Date.now()}-${tripSequence.current}`
        : request.id,
      isSimulated: request.isSimulated === true,
      language: request.language === 'en' ? 'en' : 'es',
      paymentMethod: request.paymentMethod,
      paymentStatus: request.paymentStatus
        ?? (request.paymentMethod === 'cash' || request.paymentMethod === 'Efectivo' ? 'cash' : 'pending'),
    };

    try {
      if (trip.isSimulated) {
        await createSimulatedTrip(trip);
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
  }, [activeTrip, isHydrated]);

  const transitionActiveTrip = useCallback((nextStatus) => {
    setActiveTrip((current) => {
      const nextTrip = transitionDriverTrip(current, nextStatus, {
        currentLocation: tripLocation.status === 'ready' ? tripLocation.location : null,
      });
      if (nextTrip !== current) {
        const remoteStatus = {
          arriving: 'driver_arriving',
          onboard: 'onboard',
          in_progress: 'in_progress',
          completed: 'completed',
        }[nextStatus] ?? nextStatus;
        updateTrip(current.tripId, { status: remoteStatus }).catch((error) => {
          console.error('No se pudo actualizar el estado del viaje:', error);
        });
      }
      return nextTrip;
    });
  }, [tripLocation.location, tripLocation.status]);

  const simulateDestinationArrival = useCallback(() => {
    setActiveTrip((current) => {
      if (current?.status !== 'in_progress' || !current.isSimulated) return current;
      return { ...current, demoDestinationArrival: true };
    });
  }, []);

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
      await verifyTripDocument(activeTrip.tripId);
    } catch (error) {
      console.error('No se pudo verificar el viaje antes de completarlo:', error);
      return false;
    }

    let completion;
    try {
      completion = await completeDriverTrip(activeTrip.tripId, currentLocation);
    } catch (error) {
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
    setCompletedTrips((current) => (
      current.some((trip) => trip.id === completedTrip.id) ? current : [completedTrip, ...current]
    ));
    return true;
  }, [activeTrip, tripLocation.location, tripLocation.status]);

  const value = useMemo(
    () => ({ activeTrip, completedTrips, completedTripsLoading, completedTripsError, incomingTrips, tripError, isHydrated, tripLocation, startTrip, transitionActiveTrip, simulatePickupArrival, simulateDestinationArrival, completeActiveTrip }),
    [activeTrip, completedTrips, completedTripsLoading, completedTripsError, incomingTrips, tripError, isHydrated, tripLocation, startTrip, transitionActiveTrip, simulatePickupArrival, simulateDestinationArrival, completeActiveTrip],
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
