export const PRICING = Object.freeze({
  baseFareCop: 3500,
  perKmCop: 1200,
  perMinuteCop: 250,
  minimumFareCop: 6000,
  commissionRate: 0.2,
  categoryMultipliers: Object.freeze({
    economy: 1,
    UberX: 1,
    xl: 1.4,
    premium: 1.8,
  }),
});

function roundToHundred(value) {
  return Math.round(value / 100) * 100;
}

function getCategoryMultiplier(category) {
  return PRICING.categoryMultipliers[category] ?? PRICING.categoryMultipliers.economy;
}

export function calculateFare({
  distanceKm = 0,
  durationMin = 0,
  category = 'economy',
  tip = 0,
} = {}) {
  const distance = Math.max(0, Number(distanceKm) || 0);
  const duration = Math.max(0, Number(durationMin) || 0);
  const tipCop = Math.max(0, Math.round(Number(tip) || 0));
  const calculatedFare = (
    PRICING.baseFareCop
    + distance * PRICING.perKmCop
    + duration * PRICING.perMinuteCop
  ) * getCategoryMultiplier(category);
  const fare = Math.max(PRICING.minimumFareCop, roundToHundred(calculatedFare));
  const commission = Math.round(fare * PRICING.commissionRate);

  return {
    fare,
    commission,
    driverEarnings: fare - commission + tipCop,
    tip: tipCop,
    commissionRate: PRICING.commissionRate,
  };
}

export function calculateTripEarnings(grossFareCop) {
  const result = calculateFare({ tip: 0 });
  const gross = Math.max(0, Math.round(Number(grossFareCop) || 0));
  const platformCommissionCop = Math.round(gross * result.commissionRate);

  return {
    grossFareCop: gross,
    platformCommissionCop,
    driverNetCop: gross - platformCommissionCop,
    commissionRate: result.commissionRate,
  };
}
