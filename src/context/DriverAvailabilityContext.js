import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const DriverAvailabilityContext = createContext(null);

export function DriverAvailabilityProvider({ children }) {
  const [isAvailable, setIsAvailable] = useState(false);
  const toggleAvailability = useCallback(() => {
    setIsAvailable((current) => !current);
  }, []);

  const value = useMemo(
    () => ({ isAvailable, toggleAvailability }),
    [isAvailable, toggleAvailability],
  );

  return (
    <DriverAvailabilityContext.Provider value={value}>
      {children}
    </DriverAvailabilityContext.Provider>
  );
}

export function useDriverAvailability() {
  const context = useContext(DriverAvailabilityContext);
  if (!context) {
    throw new Error('useDriverAvailability debe usarse dentro de DriverAvailabilityProvider.');
  }
  return context;
}
