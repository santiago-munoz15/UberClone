export function createMockIncomingRequest() {
  return {
    id: 'mock-request-001',
    isSimulated: true,
    status: 'requested',
    cancellationReason: null,
    origin: 'Calle 10 # 43A-32, El Poblado',
    destination: 'Parque de los Pies Descalzos, La Alpujarra',
    simulatedCoordinates: {
      isSimulated: true,
      driver: { latitude: 6.2088, longitude: -75.5679 },
      pickup: { latitude: 6.2095, longitude: -75.5688 },
      destination: { latitude: 6.2442, longitude: -75.5812 },
    },
    distanceKm: 8.4,
    estimatedDurationMinutes: 24,
    category: 'UberX',
    paymentMethod: 'Efectivo',
    estimatedFareCop: 34_000,
  };
}
