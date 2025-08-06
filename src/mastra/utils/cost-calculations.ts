/**
 * Cost Calculation and Comparison Logic (DRY Principle)
 * Standardizes calculation processes frequently used in cost analysis
 */

import type { ProcessedCostData, ServiceCostData } from '../types/aws-cost-data.js';

/**
 * Calculate percentage change
 * @param current - Current value
 * @param previous - Previous value
 * @returns Percentage change (rounded to 2 decimal places)
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  
  const change = ((current - previous) / previous) * 100;
  return Math.round(change * 100) / 100;
}

/**
 * Determine trend (MVP)
 * @param percentageChange - Percentage change
 * @param threshold - Change threshold (default 5%)
 * @returns Trend determination result
 */
export function determineTrend(
  percentageChange: number, 
  threshold: number = 5
): 'increasing' | 'decreasing' | 'stable' {
  const absChange = Math.abs(percentageChange);
  
  if (absChange < threshold) {
    return 'stable';
  }
  
  return percentageChange > 0 ? 'increasing' : 'decreasing';
}

/**
 * Format amount (currency display)
 * @param amount - Amount
 * @param currency - Currency code (default: USD)
 * @param locale - Locale (default: en-US)
 * @returns Formatted amount string
 */
export function formatCurrency(
  amount: number, 
  currency: string = 'USD', 
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format percentage
 * @param percentage - Percentage
 * @param showSign - Whether to show sign (default: true)
 * @returns Formatted percentage string
 */
export function formatPercentage(percentage: number, showSign: boolean = true): string {
  const sign = showSign && percentage > 0 ? '+' : '';
  return `${sign}${percentage}%`;
}

/**
 * Get top N services
 * @param services - Array of service cost data
 * @param topN - Number of top services to get (default: 10)
 * @returns Top N services
 */
export function getTopServices(services: ServiceCostData[], topN: number = 10): ServiceCostData[] {
  return services
    .sort((a, b) => b.cost - a.cost)
    .slice(0, topN);
}

/**
 * Generate cost analysis summary text (MVP)
 * @param data - Processed cost data
 * @returns Summary string
 */
export function generateCostSummary(data: ProcessedCostData): string {
  const formattedCost = formatCurrency(data.totalCost, data.currency);
  const startDate = new Date(data.period.start);
  const year = startDate.getFullYear();
  const month = startDate.toLocaleString('en-US', { month: 'long' });
  const period = `${month} ${year}`;
  
  if (!data.trends.monthOverMonth) {
    return `Total cost for ${period} was ${formattedCost}.`;
  }
  
  const percentageChange = data.trends.monthOverMonth;
  const trendText = data.trends.trend === 'increasing' ? 'increase' : 
                   data.trends.trend === 'decreasing' ? 'decrease' : 'stable';
  
  // Add top services information
  const topServices = getTopServices(data.services, 5);
  const topServiceText = topServices.map(s => 
    `${s.name} (${formatCurrency(s.cost)}, ${formatPercentage(s.percentage, false)})`
  ).join(', ');
  
  return `Total cost for ${period} was ${formattedCost}, showing ${formatPercentage(percentageChange)} ${trendText} compared to previous period. Top costs: ${topServiceText}`;
} 