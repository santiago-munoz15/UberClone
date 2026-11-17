export const MAX_PICKUP_DISTANCE_METERS = 100;
export const MAX_PICKUP_ACCURACY_METERS = 30;
export const MAX_LOCATION_AGE_MS = 10_000;

export function distanceBetweenCoordinates(first, second) {
  if (!isValidCoordinate(first) || !isValidCoordinate(second)) return null;

  const radians = (degrees) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(second.latitude - first.latitude);
  const longitudeDelta = radians(second.longitude - first.longitude);
  const firstLatitude = radians(first.latitude);
  const secondLatitude = radians(second.latitude);
  const haversine = (Math.sin(latitudeDelta / 2) ** 2)
    + Math.cos(firstLatitude) * Math.cos(secondLatitude) * (Math.sin(longitudeDelta / 2) ** 2);
  const boundedHaversine = Math.min(1, Math.max(0, haversine));

  return 6_371_000 * 2 * Math.atan2(Math.sqrt(boundedHaversine), Math.sqrt(1 - boundedHaversine));
}

export function validatePickupProximity(location, pickup, now = Date.now()) {
  if (!isValidCoordinate(location) || !isValidCoordinate(pickup)) {
    return { allowed: false, reason: 'location_unavailable', distanceMeters: null };
  }

  const distanceMeters = distanceBetweenCoordinates(location, pickup);
  if (!Number.isFinite(location.accuracy) || location.accuracy < 0 || location.accuracy > MAX_PICKUP_ACCURACY_METERS) {
    return { allowed: false, reason: 'accuracy_insufficient', distanceMeters };
  }

  if (!Number.isFinite(location.timestamp) || now - location.timestamp < 0 || now - location.timestamp > MAX_LOCATION_AGE_MS) {
    return { allowed: false, reason: 'location_stale', distanceMeters };
  }

  return {
    allowed: distanceMeters <= MAX_PICKUP_DISTANCE_METERS,
    reason: distanceMeters <= MAX_PICKUP_DISTANCE_METERS ? 'ready' : 'too_far',
    distanceMeters,
  };
}

function isValidCoordinate(coordinate) {
  return Number.isFinite(coordinate?.latitude)
    && Number.isFinite(coordinate?.longitude)
    && Math.abs(coordinate.latitude) <= 90
    && Math.abs(coordinate.longitude) <= 180;
}
