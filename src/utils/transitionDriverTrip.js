import { validatePickupProximity } from './pickupProximity';

const ALLOWED_TRANSITIONS = {
  accepted: 'arriving',
  arriving: 'onboard',
  onboard: 'in_progress',
  in_progress: 'completed',
};

export function transitionDriverTrip(trip, nextStatus, transitionData = {}) {
  if (!trip || trip.status === 'completed') return trip;
  if (ALLOWED_TRANSITIONS[trip.status] !== nextStatus) return trip;

  if (trip.status === 'arriving' && nextStatus === 'onboard') {
    const pickupValidation = validatePickupProximity(transitionData.currentLocation, trip.pickupLocation);
    if (!pickupValidation.allowed) return trip;
  }

  if (trip.status === 'in_progress' && nextStatus === 'completed') {
    const destinationValidation = validatePickupProximity(transitionData.currentLocation, trip.destinationLocation);
    if (!destinationValidation.allowed) return trip;
  }

  const { currentLocation, ...safeTransitionData } = transitionData;
  return { ...trip, ...safeTransitionData, status: nextStatus };
}
