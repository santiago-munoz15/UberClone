export const TERMINAL_TRIP_STATUSES = new Set(['completed', 'paid', 'cancelled']);

export function isTerminalTripStatus(status) {
  return TERMINAL_TRIP_STATUSES.has(status);
}
