import { validatePickupProximity } from './pickupProximity';

const ALLOWED_TRANSITIONS = {
  accepted: 'arriving',
  arriving: 'in_progress',
  in_progress: 'completed',
};

export function transitionDriverTrip(trip, nextStatus, transitionData = {}) {
  if (!trip || trip.status === 'completed') return trip;
  if (ALLOWED_TRANSITIONS[trip.status] !== nextStatus) return trip;

  if (trip.status === 'arriving' && nextStatus === 'in_progress') {
    const pickupValidation = validatePickupProximity(transitionData.currentLocation, trip.pickupLocation);
    if (!pickupValidation.allowed) return trip;
  }

  const { currentLocation, ...safeTransitionData } = transitionData;
  return { ...trip, ...safeTransitionData, status: nextStatus };
}
