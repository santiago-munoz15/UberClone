const ALLOWED_TRANSITIONS = {
  accepted: 'arriving',
  arriving: 'in_progress',
  in_progress: 'completed',
};

export function transitionDriverTrip(trip, nextStatus) {
  if (!trip || trip.status === 'completed') return trip;
  if (ALLOWED_TRANSITIONS[trip.status] !== nextStatus) return trip;

  return { ...trip, status: nextStatus };
}
