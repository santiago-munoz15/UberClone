import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { calculateTripEarnings } from '../config/pricing';
import {
  findMockTripPaymentScenario,
  getDefaultTripPaymentScenario,
} from '../data/mockTripPaymentScenarios';
import { transitionDriverTrip } from '../utils/transitionDriverTrip';

const DriverTripContext = createContext(null);

export function DriverTripProvider({ children }) {
  const [activeTrip, setActiveTrip] = useState(null);

  const startTrip = useCallback((request) => {
    if (!request?.isSimulated || request.status !== 'accepted') return false;

    const paymentScenario = getDefaultTripPaymentScenario(request.paymentMethod);
    setActiveTrip({
      ...request,
      language: request.language === 'en' ? 'en' : 'es',
      paymentScenarioId: paymentScenario.id,
      paymentMethod: paymentScenario.paymentMethod,
      paymentStatus: paymentScenario.paymentStatus,
    });
    return true;
  }, []);

  const transitionActiveTrip = useCallback((nextStatus) => {
    setActiveTrip((current) => transitionDriverTrip(current, nextStatus));
  }, []);

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
    if (activeTrip?.status !== 'in_progress') return false;

    const finalFareCop = calculateTripEarnings(activeTrip.estimatedFareCop).grossFareCop;
    const paymentScenario = findMockTripPaymentScenario(activeTrip.paymentScenarioId)
      ?? getDefaultTripPaymentScenario(activeTrip.paymentMethod);

    setActiveTrip((current) => transitionDriverTrip(current, 'completed', {
      finalFareCop,
      paymentMethod: paymentScenario.paymentMethod,
      paymentStatus: paymentScenario.paymentStatus,
      paymentScenarioId: paymentScenario.id,
    }));
    return true;
  }, [activeTrip]);

  const value = useMemo(
    () => ({ activeTrip, startTrip, transitionActiveTrip, selectPaymentScenario, completeActiveTrip }),
    [activeTrip, startTrip, transitionActiveTrip, selectPaymentScenario, completeActiveTrip],
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
