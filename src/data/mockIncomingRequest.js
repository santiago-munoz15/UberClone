export function createMockIncomingRequest() {
  const requestId = `mock-request-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id: requestId,
    isSimulated: true,
    status: 'requested',
    cancellationReason: null,
    origin: 'Calle 10 # 43A-32, El Poblado',
    destination: 'Parque de los Pies Descalzos, La Alpujarra',
    pickupLocation: { latitude: 6.2095, longitude: -75.5688 },
    destinationLocation: { latitude: 6.2442, longitude: -75.5812 },
    distanceKm: 8.4,
    estimatedDurationMinutes: 24,
    category: 'UberX',
    paymentMethod: 'Mercado Pago',
    estimatedFareCop: 34_000,
  };
}
