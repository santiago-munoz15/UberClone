import { calculateTripEarnings } from '../config/pricing';

const PERIODS = ['all', 'today', 'week', 'month', 'custom'];

function getLocalDayStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseLocalDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return getLocalDayStart(value);
  }
  if (typeof value !== 'string') return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, year, month, day] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  if (parsed.getFullYear() !== Number(year)
    || parsed.getMonth() !== Number(month) - 1
    || parsed.getDate() !== Number(day)) return null;
  return parsed;
}

function getPeriodRange(period, now, dateFrom, dateTo) {
  if (period === 'all') return { start: null, end: null, valid: true };

  if (period === 'custom') {
    const start = dateFrom ? parseLocalDate(dateFrom) : null;
    const endDay = dateTo ? parseLocalDate(dateTo) : null;
    const end = endDay ? new Date(endDay) : null;
    if (end) end.setDate(end.getDate() + 1);
    return {
      start,
      end,
      valid: (!dateFrom || start) && (!dateTo || endDay) && (!start || !endDay || start <= endDay),
    };
  }

  const start = getLocalDayStart(now);
  if (period === 'week') {
    const daysSinceMonday = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - daysSinceMonday);
  } else if (period === 'month') {
    start.setDate(1);
  }

  const end = new Date(start);
  if (period === 'today') end.setDate(end.getDate() + 1);
  if (period === 'week') end.setDate(end.getDate() + 7);
  if (period === 'month') end.setMonth(end.getMonth() + 1);
  return { start, end, valid: true };
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

export function filterCompletedTrips(
  completedTrips = [],
  { period = 'all', dateFrom, dateTo, paymentMethod = 'all', now = new Date() } = {},
) {
  if (!PERIODS.includes(period)) throw new Error(`Periodo de viajes no valido: ${period}`);
  const range = getPeriodRange(period, now, dateFrom, dateTo);
  if (!range.valid) return [];

  return completedTrips
    .filter((trip) => {
      if (trip.status !== 'completed') return false;
      if (paymentMethod !== 'all' && trip.paymentMethod !== paymentMethod) return false;
      const completedAt = getCompletedAtDate(trip);
      return completedAt
        && (!range.start || completedAt >= range.start)
        && (!range.end || completedAt < range.end);
    })
    .slice()
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
}

export function aggregateDriverEarnings(completedTrips = [], period = 'today', now = new Date()) {
  if (!PERIODS.includes(period) || period === 'all' || period === 'custom') {
    throw new Error(`Periodo de ganancias no valido: ${period}`);
  }

  const trips = filterCompletedTrips(completedTrips, { period, now })
    .map((trip) => ({ ...trip, ...getTripAmounts(trip) }));

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
