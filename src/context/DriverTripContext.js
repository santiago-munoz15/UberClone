import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { transitionDriverTrip } from '../utils/transitionDriverTrip';

const DriverTripContext = createContext(null);

export function DriverTripProvider({ children }) {
  const [activeTrip, setActiveTrip] = useState(null);

  const startTrip = useCallback((request) => {
    if (!request?.isSimulated || request.status !== 'accepted') return false;

    setActiveTrip({ ...request, language: request.language === 'en' ? 'en' : 'es' });
    return true;
  }, []);

  const transitionActiveTrip = useCallback((nextStatus) => {
    setActiveTrip((current) => transitionDriverTrip(current, nextStatus));
  }, []);

  const value = useMemo(
    () => ({ activeTrip, startTrip, transitionActiveTrip }),
    [activeTrip, startTrip, transitionActiveTrip],
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
