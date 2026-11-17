import { useMemo } from 'react';
import { useDriverTrip } from '../context/DriverTripContext';
import { aggregateDriverEarnings } from '../utils/aggregateDriverEarnings';

export default function useEarnings(period = 'today') {
  const { completedTrips } = useDriverTrip();
  const summary = useMemo(
    () => aggregateDriverEarnings(completedTrips, period),
    [completedTrips, period],
  );

  return { completedTrips, summary };
}
