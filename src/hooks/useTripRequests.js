import { useMemo } from 'react';
import { useDriverTrip } from '../context/DriverTripContext';

export default function useTripRequests() {
  const { incomingTrips, isHydrated, startTrip } = useDriverTrip();

  return useMemo(() => ({
    incomingTrips,
    isHydrated,
    startTrip,
  }), [incomingTrips, isHydrated, startTrip]);
}
