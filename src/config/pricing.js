export const PLATFORM_COMMISSION_RATE = 0.2;

export function calculateTripEarnings(grossFareCop) {
  const gross = Math.max(0, Math.round(grossFareCop));
  const platformCommissionCop = Math.round(gross * PLATFORM_COMMISSION_RATE);

  return {
    grossFareCop: gross,
    platformCommissionCop,
    driverNetCop: gross - platformCommissionCop,
  };
}
