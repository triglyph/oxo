export function round(value, precision) {
  const mult = Math.pow(10, precision || 0);
  return Math.round(value * mult) / mult;
}