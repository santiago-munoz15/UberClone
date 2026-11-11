const ROUTE_POINTS = {
  driver: { x: 0.16, y: 0.72 },
  pickup: { x: 0.42, y: 0.38 },
  destination: { x: 0.84, y: 0.24 },
  junctionA: { x: 0.3, y: 0.72 },
  junctionB: { x: 0.3, y: 0.43 },
  junctionC: { x: 0.57, y: 0.43 },
  junctionD: { x: 0.57, y: 0.25 },
  junctionE: { x: 0.84, y: 0.25 },
};

const ROUTE_PATHS = {
  pickup: ['driver', 'junctionA', 'junctionB', 'pickup'],
  destination: ['pickup', 'junctionC', 'junctionD', 'junctionE', 'destination'],
};

export function getTripRouteGeometry(status, size, coordinates) {
  if (!size?.width || !size?.height || status === 'completed') {
    return { segments: [], markers: [] };
  }

  const isPickupLeg = status === 'accepted' || status === 'arriving';
  const path = ROUTE_PATHS[isPickupLeg ? 'pickup' : 'destination'];
  const points = path.map((name) => ROUTE_POINTS[name]);
  const segments = points.slice(0, -1).map((start, index) => {
    const end = points[index + 1];
    const x1 = start.x * size.width;
    const y1 = start.y * size.height;
    const x2 = end.x * size.width;
    const y2 = end.y * size.height;
    const length = Math.hypot(x2 - x1, y2 - y1);
    const angle = Math.atan2(y2 - y1, x2 - x1);

    return {
      key: `${path[index]}-${path[index + 1]}`,
      left: (x1 + x2 - length) / 2,
      top: (y1 + y2) / 2,
      length,
      angle: `${angle}rad`,
    };
  });

  const driver = coordinates?.driver;
  const pickup = coordinates?.pickup;
  const destination = coordinates?.destination;

  return {
    segments,
    markers: [
      { key: 'driver', point: ROUTE_POINTS[isPickupLeg ? 'driver' : 'pickup'], kind: 'driver', coordinate: driver },
      { key: 'pickup', point: ROUTE_POINTS.pickup, kind: 'pickup', coordinate: pickup },
      { key: 'destination', point: ROUTE_POINTS.destination, kind: 'destination', coordinate: destination },
    ].map((marker) => ({
      ...marker,
      left: marker.point.x * size.width,
      top: marker.point.y * size.height,
    })),
  };
}
