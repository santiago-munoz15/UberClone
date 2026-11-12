import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { calculateTripEarnings } from '../config/pricing';
import {
  findMockTripPaymentScenario,
  getDefaultTripPaymentScenario,
} from '../data/mockTripPaymentScenarios';
import { transitionDriverTrip } from '../utils/transitionDriverTrip';
import useTripLocation from '../hooks/useTripLocation';

const DriverTripContext = createContext(null);

export function DriverTripProvider({ children }) {
  const [activeTrip, setActiveTrip] = useState(null);
  const [completedTrips, setCompletedTrips] = useState([]);
  const tripSequence = useRef(0);
  const recordedTripIds = useRef(new Set());
  const tripLocation = useTripLocation(Boolean(activeTrip && activeTrip.status !== 'completed'), activeTrip?.tripId);

  const startTrip = useCallback((request) => {
    if (!request?.isSimulated || request.status !== 'accepted') return false;

    const paymentScenario = getDefaultTripPaymentScenario(request.paymentMethod);
    tripSequence.current += 1;
    setActiveTrip({
      ...request,
      tripId: `trip-${Date.now()}-${tripSequence.current}`,
      language: request.language === 'en' ? 'en' : 'es',
      paymentScenarioId: paymentScenario.id,
      paymentMethod: paymentScenario.paymentMethod,
      paymentStatus: paymentScenario.paymentStatus,
    });
    return true;
  }, []);

  const transitionActiveTrip = useCallback((nextStatus) => {
    setActiveTrip((current) => transitionDriverTrip(current, nextStatus, {
      currentLocation: tripLocation.status === 'ready' ? tripLocation.location : null,
    }));
  }, [tripLocation.location, tripLocation.status]);

  const selectPaymentScenario = useCallback((scenarioId) => {
    const scenario = findMockTripPaymentScenario(scenarioId);
    if (!scenario) return;

    setActiveTrip((current) => {
      if (current?.status !== 'in_progress') return current;
      return {
        ...current,
        paymentScenarioId: scenario.id,
        paymentMethod: scenario.paymentMethod,
        paymentStatus: scenario.paymentStatus,
      };
    });
  }, []);

  const completeActiveTrip = useCallback(() => {
    if (activeTrip?.status !== 'in_progress' || recordedTripIds.current.has(activeTrip.tripId)) return false;

    const finalFareCop = calculateTripEarnings(activeTrip.estimatedFareCop).grossFareCop;
    const earnings = calculateTripEarnings(finalFareCop);
    const paymentScenario = findMockTripPaymentScenario(activeTrip.paymentScenarioId)
      ?? getDefaultTripPaymentScenario(activeTrip.paymentMethod);
    const completedAt = new Date().toISOString();
    const completedTrip = {
      ...activeTrip,
      status: 'completed',
      requestId: activeTrip.id,
      id: activeTrip.tripId,
      finalFareCop,
      platformCommissionCop: earnings.platformCommissionCop,
      driverNetCop: earnings.driverNetCop,
      tipCop: 0,
      completedAt,
      paymentMethod: paymentScenario.paymentMethod,
      paymentStatus: paymentScenario.paymentStatus,
      paymentScenarioId: paymentScenario.id,
    };

    recordedTripIds.current.add(activeTrip.tripId);
    setActiveTrip((current) => transitionDriverTrip(current, 'completed', {
      finalFareCop,
      platformCommissionCop: earnings.platformCommissionCop,
      driverNetCop: earnings.driverNetCop,
      tipCop: 0,
      completedAt,
      paymentMethod: paymentScenario.paymentMethod,
      paymentStatus: paymentScenario.paymentStatus,
      paymentScenarioId: paymentScenario.id,
    }));
    setCompletedTrips((current) => (
      current.some((trip) => trip.id === completedTrip.id) ? current : [completedTrip, ...current]
    ));
    return true;
  }, [activeTrip]);

  const value = useMemo(
    () => ({ activeTrip, completedTrips, tripLocation, startTrip, transitionActiveTrip, selectPaymentScenario, completeActiveTrip }),
    [activeTrip, completedTrips, tripLocation, startTrip, transitionActiveTrip, selectPaymentScenario, completeActiveTrip],
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
