import { useEffect, useMemo, useState } from 'react';

const SIMULATED_LOCATION = Object.freeze({
  latitude: 6.2442,
  longitude: -75.5812,
  label: 'Laureles, Medellín',
  source: 'simulated',
});

export default function useDriverLocation() {
  const [lastUpdatedAt, setLastUpdatedAt] = useState(() => new Date());

  useEffect(() => {
    // Simula un proveedor local de ubicacion sin solicitar permisos ni usar GPS.
    const refreshTimer = setInterval(() => {
      setLastUpdatedAt(new Date());
    }, 30_000);

    return () => clearInterval(refreshTimer);
  }, []);

  return useMemo(
    () => ({ ...SIMULATED_LOCATION, lastUpdatedAt }),
    [lastUpdatedAt],
  );
}
