const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';
const MIN_REQUEST_INTERVAL_MS = 1000;
let nextRequestAt = 0;
let requestQueue = Promise.resolve();

function wait(milliseconds, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }

    const timeout = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, milliseconds);

    function onAbort() {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', onAbort);
      reject(createAbortError());
    }

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function createAbortError() {
  const error = new Error('Route request cancelled.');
  error.name = 'AbortError';
  return error;
}

async function reserveRequestSlot(signal) {
  const scheduled = requestQueue.then(async () => {
    const delay = Math.max(0, nextRequestAt - Date.now());
    if (delay > 0) await wait(delay, signal);
    if (signal?.aborted) throw createAbortError();
    nextRequestAt = Date.now() + MIN_REQUEST_INTERVAL_MS;
  });
  requestQueue = scheduled.catch(() => {});
  await scheduled;
}

function validateCoordinate(coordinate) {
  return Number.isFinite(coordinate?.latitude)
    && Number.isFinite(coordinate?.longitude)
    && Math.abs(coordinate.latitude) <= 90
    && Math.abs(coordinate.longitude) <= 180;
}

export async function fetchDrivingRoute(start, end, signal) {
  if (!validateCoordinate(start) || !validateCoordinate(end)) {
    throw new Error('INVALID_COORDINATES');
  }

  await reserveRequestSlot(signal);
  const coordinates = `${start.longitude},${start.latitude};${end.longitude},${end.latitude}`;
  const url = `${OSRM_BASE_URL}/${coordinates}?overview=full&geometries=geojson&steps=false`;

  let response;
  try {
    response = await fetch(url, { signal });
  } catch (error) {
    if (signal?.aborted || error?.name === 'AbortError') throw createAbortError();
    throw new Error('NETWORK_UNAVAILABLE');
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error(response.ok ? 'INVALID_ROUTE_RESPONSE' : 'ROUTE_SERVICE_UNAVAILABLE');
  }

  if (payload.code !== 'Ok' || !Array.isArray(payload.routes) || !payload.routes[0]) {
    throw new Error(payload.code === 'NoRoute' || payload.code === 'NoSegment' ? 'NO_ROUTE_FOUND' : 'ROUTE_SERVICE_UNAVAILABLE');
  }
  if (!response.ok) throw new Error('ROUTE_SERVICE_UNAVAILABLE');

  const route = payload.routes[0];
  const coordinatesInRoute = route.geometry?.coordinates;
  if (!Array.isArray(coordinatesInRoute) || coordinatesInRoute.length < 2) {
    throw new Error('INVALID_ROUTE_RESPONSE');
  }

  return {
    coordinates: coordinatesInRoute.map(([longitude, latitude]) => ({ latitude, longitude })),
    distanceKm: route.distance / 1000,
    durationMinutes: route.duration / 60,
  };
}
