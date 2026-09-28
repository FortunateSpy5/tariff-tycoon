/**
 * Big Number & Currency Formatting Utilities
 * Powered by break_infinity.js to support progression from $1 to $10^42.
 */

import Decimal from 'break_infinity.js';

export { Decimal };

const SUFFIXES = [
  '',
  'K',
  'M',
  'B',
  'T',
  'Qa',
  'Qi',
  'Sx',
  'Sp',
  'Oc',
  'No',
  'Dc',
  'UDc',
  'DDc',
  'TDc',
  'QaDc',
  'QiDc',
];

/**
 * Converts a number, string, or Decimal to a Decimal instance.
 *
 * INVARIANT: module-private. It is a coercion helper for `formatCurrency`, not
 * part of the engine's public surface — exporting it invited callers to build
 * raw Decimal math in components, which is where big-number bugs come from.
 */
function toDecimal(value: number | string | Decimal): Decimal {
  if (value instanceof Decimal) return value;
  return new Decimal(value);
}

/**
 * Formats large cash numbers into readable satirical abbreviations or scientific notation.
 * Examples: $450.00, $1.25M, $45.89B, $9.12e42
 */
export function formatCurrency(value: number | string | Decimal): string {
  const dec = toDecimal(value);

  if (Number.isNaN(dec.m)) return '$0.00';
  if (dec.lt(0)) return `-$${formatCurrency(dec.abs().toString()).replace('$', '')}`;
  if (dec.lt(1000)) {
    return `$${dec.toNumber().toFixed(2)}`;
  }

  // Decimal.exponent gives base-10 magnitude
  const exp = dec.exponent;
  const suffixIndex = Math.floor(exp / 3);

  if (suffixIndex < SUFFIXES.length) {
    const scaled = dec.div(Decimal.pow(10, suffixIndex * 3)).toNumber();
    return `$${scaled.toFixed(2)}${SUFFIXES[suffixIndex]}`;
  }

  // Scientific notation for Phase 4 Ontological scale ($10^18 to $10^42)
  return `$${dec.toExponential(2)}`;
}
