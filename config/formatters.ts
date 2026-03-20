import type { CurrencyConfig } from './useCases';

/**
 * Format a number as currency using the provided config.
 *
 * Examples:
 *   formatCurrency(1589.50, { symbol: '$', decimalSeparator: '.', thousandSeparator: ',' })
 *   → "$ 1,589.50"
 *
 *   formatCurrency(5230.00, { symbol: 'R$', decimalSeparator: ',', thousandSeparator: '.' })
 *   → "R$ 5.230,00"
 */
export function formatCurrency(
  value: number,
  currency: CurrencyConfig,
  options?: { showSymbol?: boolean; decimals?: number },
): string {
  const showSymbol = options?.showSymbol ?? true;
  const decimals = options?.decimals ?? 2;

  const fixed = Math.abs(value).toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');

  const withThousands = intPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    currency.thousandSeparator,
  );

  const formatted = decPart
    ? `${withThousands}${currency.decimalSeparator}${decPart}`
    : withThousands;

  const sign = value < 0 ? '-' : '';

  if (showSymbol) {
    return `${sign}${currency.symbol} ${formatted}`;
  }
  return `${sign}${formatted}`;
}

/**
 * Interpolate template strings with variables.
 *
 * Example:
 *   interpolate('Up to {amount} OFF', { amount: 'R$ 1.940,00' })
 *   → "Up to R$ 1.940,00 OFF"
 */
export function interpolate(
  template: string,
  variables: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const val = variables[key];
    return val !== undefined ? String(val) : `{${key}}`;
  });
}
