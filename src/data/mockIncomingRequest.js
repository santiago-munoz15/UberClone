export function createMockIncomingRequest() {
  return {
    id: 'mock-request-001',
    isSimulated: true,
    status: 'requested',
    cancellationReason: null,
    origin: 'Calle 10 # 43A-32, El Poblado',
    destination: 'Parque de los Pies Descalzos, La Alpujarra',
    distanceKm: 8.4,
    estimatedDurationMinutes: 24,
    category: 'UberX',
    paymentMethod: 'Efectivo',
    estimatedFareCop: 34_000,
  };
}
