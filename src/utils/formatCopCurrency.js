const copFormatter = new Intl.NumberFormat('es-CO', {
  currency: 'COP',
  maximumFractionDigits: 0,
  style: 'currency',
});

export function formatCopCurrency(amount) {
  return copFormatter.format(amount);
}
