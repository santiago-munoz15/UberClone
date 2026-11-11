import { calculateTripEarnings } from '../config/pricing';

const PERIODS = ['today', 'week', 'month'];

function getLocalDayStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getPeriodStart(period, now) {
  const start = getLocalDayStart(now);

  if (period === 'week') {
    const daysSinceMonday = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - daysSinceMonday);
  } else if (period === 'month') {
    start.setDate(1);
  }

  return start;
}

function getCompletedAtDate(trip) {
  const date = new Date(trip.completedAt);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getTripAmounts(trip) {
  const earnings = calculateTripEarnings(trip.finalFareCop ?? 0);
  const tipCop = Math.max(0, Math.round(Number(trip.tipCop) || 0));

  return { ...earnings, tipCop, generatedNetCop: earnings.driverNetCop + tipCop };
}

export function aggregateDriverEarnings(completedTrips = [], period = 'today', now = new Date()) {
  if (!PERIODS.includes(period)) throw new Error(`Periodo de ganancias no válido: ${period}`);

  const periodStart = getPeriodStart(period, now);
  const periodEnd = new Date(periodStart);
  if (period === 'today') periodEnd.setDate(periodEnd.getDate() + 1);
  if (period === 'week') periodEnd.setDate(periodEnd.getDate() + 7);
  if (period === 'month') periodEnd.setMonth(periodEnd.getMonth() + 1);

  const trips = completedTrips
    .filter((trip) => {
      if (trip.status !== 'completed') return false;
      const completedAt = getCompletedAtDate(trip);
      return completedAt && completedAt >= periodStart && completedAt < periodEnd;
    })
    .map((trip) => ({ ...trip, ...getTripAmounts(trip) }))
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

  const totals = trips.reduce((result, trip) => {
    result.totalInvoicedCop += trip.grossFareCop;
    result.commissionsCop += trip.platformCommissionCop;
    result.tipsCop += trip.tipCop;
    result.generatedNetCop += trip.generatedNetCop;
    if (trip.paymentStatus === 'cash') {
      result.cashGrossReceivedCop += trip.grossFareCop + trip.tipCop;
      result.cashCommissionOwedCop += trip.platformCommissionCop;
      result.cashNetAvailableCop += trip.driverNetCop + trip.tipCop;
    } else if (trip.paymentStatus === 'approved') {
      result.electronicApprovedGrossReceivedCop += trip.grossFareCop + trip.tipCop;
      result.electronicApprovedNetAvailableCop += trip.driverNetCop + trip.tipCop;
    } else if (trip.paymentStatus === 'pending') {
      result.electronicPendingCop += trip.grossFareCop + trip.tipCop;
    } else if (trip.paymentStatus === 'rejected') {
      result.electronicRejectedCop += trip.grossFareCop + trip.tipCop;
    }
    return result;
  }, {
    totalInvoicedCop: 0,
    commissionsCop: 0,
    tipsCop: 0,
    generatedNetCop: 0,
    cashGrossReceivedCop: 0,
    cashCommissionOwedCop: 0,
    cashNetAvailableCop: 0,
    electronicApprovedGrossReceivedCop: 0,
    electronicApprovedNetAvailableCop: 0,
    electronicPendingCop: 0,
    electronicRejectedCop: 0,
  });

  return {
    period,
    trips,
    tripCount: trips.length,
    ...totals,
    averageNetPerTripCop: trips.length ? Math.round(totals.generatedNetCop / trips.length) : 0,
    availableBalanceCop: totals.cashNetAvailableCop + totals.electronicApprovedNetAvailableCop,
  };
}
