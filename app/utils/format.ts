/**
 * Formats a number with commas as thousands separators.
 * @param num The number to format.
 * @returns The formatted number string.
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}