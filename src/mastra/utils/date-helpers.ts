/**
 * Common Date Processing Functions (DRY Principle)
 * Shared logic for previous month, current month, period calculations, etc.
 */

/**
 * Get date with specified month offset
 * @param monthOffset - Month offset (-1 for previous month, 0 for current month)
 * @returns Date string in YYYY-MM-DD format
 */
export function getDateByOffset(monthOffset: number): string {
  const now = new Date();
  const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  return targetDate.toISOString().split('T')[0];
}

/**
 * Get first and last dates of a month
 * @param monthOffset - Month offset (-1 for previous month, 0 for current month)
 * @returns {start: string, end: string} Start and end dates of the period
 */
export function getMonthRange(monthOffset: number): { start: string; end: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + monthOffset;
  
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0); // 0th day of next month = last day of current month
  
  return {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0]
  };
}

/**
 * Format period for display
 * @param start - Start date (YYYY-MM-DD)
 * @param end - End date (YYYY-MM-DD)
 * @returns Display period string (e.g., "January 2024")
 */
export function formatPeriod(start: string, end: string): string {
  const startDate = new Date(start);
  const year = startDate.getFullYear();
  const month = startDate.toLocaleString('en-US', { month: 'long' });
  
  return `${month} ${year}`;
}

/**
 * Check if date is valid
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Whether the date is valid
 */
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Get current date (YYYY-MM-DD format)
 * @returns Today's date
 */
export function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Check if specified period is valid
 * @param start - Start date
 * @param end - End date
 * @returns Whether the period is valid
 */
export function isValidPeriod(start: string, end: string): boolean {
  if (!isValidDate(start) || !isValidDate(end)) {
    return false;
  }
  
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  return startDate <= endDate;
} 