export const MOCK_TRIP_PAYMENT_SCENARIOS = [
  { id: 'cash', paymentMethod: 'Efectivo', paymentStatus: 'cash', titleKey: 'cashScenario', statusKey: 'cashStatus' },
  { id: 'mercado-pago-approved', paymentMethod: 'Mercado Pago', paymentStatus: 'approved', titleKey: 'mercadoPagoApprovedScenario', statusKey: 'approvedStatus' },
  { id: 'mercado-pago-pending', paymentMethod: 'Mercado Pago', paymentStatus: 'pending', titleKey: 'mercadoPagoPendingScenario', statusKey: 'pendingStatus' },
  { id: 'mercado-pago-rejected', paymentMethod: 'Mercado Pago', paymentStatus: 'rejected', titleKey: 'mercadoPagoRejectedScenario', statusKey: 'rejectedStatus' },
  { id: 'stripe-approved', paymentMethod: 'Stripe', paymentStatus: 'approved', titleKey: 'stripeApprovedScenario', statusKey: 'approvedStatus' },
  { id: 'stripe-pending', paymentMethod: 'Stripe', paymentStatus: 'pending', titleKey: 'stripePendingScenario', statusKey: 'pendingStatus' },
  { id: 'stripe-rejected', paymentMethod: 'Stripe', paymentStatus: 'rejected', titleKey: 'stripeRejectedScenario', statusKey: 'rejectedStatus' },
];

export const DEFAULT_TRIP_PAYMENT_SCENARIO_ID = 'cash';

export function findMockTripPaymentScenario(scenarioId) {
  return MOCK_TRIP_PAYMENT_SCENARIOS.find((scenario) => scenario.id === scenarioId) ?? null;
}

export function getDefaultTripPaymentScenario(paymentMethod) {
  if (paymentMethod === 'Efectivo') {
    return findMockTripPaymentScenario(DEFAULT_TRIP_PAYMENT_SCENARIO_ID);
  }

  return MOCK_TRIP_PAYMENT_SCENARIOS.find((scenario) => scenario.paymentMethod === paymentMethod)
    ?? findMockTripPaymentScenario(DEFAULT_TRIP_PAYMENT_SCENARIO_ID);
}
