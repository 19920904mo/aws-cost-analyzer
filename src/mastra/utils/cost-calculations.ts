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
 * Calculate amount difference
 * @param current - Current amount
 * @param previous - Previous amount
 * @returns Amount difference
 */
export function calculateAmountChange(current: number, previous: number): number {
  return Math.round((current - previous) * 100) / 100;
}

/**
 * Calculate cost composition ratio
 * @param partialCost - Partial cost
 * @param totalCost - Total cost
 * @returns Composition ratio percentage
 */
export function calculatePercentage(partialCost: number, totalCost: number): number {
  if (totalCost === 0) return 0;
  
  const percentage = (partialCost / totalCost) * 100;
  return Math.round(percentage * 100) / 100;
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
  const topServices = getTopServices(data.services, 3);
  const topServiceText = topServices.map(s => 
    `${s.name} (${formatCurrency(s.cost)}, ${formatPercentage(s.percentage, false)})`
  ).join(', ');
  
  return `Total cost for ${period} was ${formattedCost}, showing ${formatPercentage(percentageChange)} ${trendText} compared to previous period. Top costs: ${topServiceText}`;
}

/**
 * Generate cost optimization suggestions
 * @param services - Service cost data
 * @param threshold - Minimum cost threshold for suggestions (default: $100)
 * @returns Array of cost optimization suggestions
 */
export function generateCostOptimizationSuggestions(
  services: ServiceCostData[], 
  threshold: number = 100
): string[] {
  const suggestions: string[] = [];
  const topServices = getTopServices(services, 5);
  
  for (const service of topServices) {
    if (service.cost < threshold) continue;
    
    switch (service.name) {
      case 'Amazon Elastic Compute Cloud - Compute':
        suggestions.push(
          `EC2 instances (${formatCurrency(service.cost)}): Consider Reserved Instances for 20-40% cost savings.`
        );
        break;
      case 'Amazon Simple Storage Service':
        suggestions.push(
          `S3 storage (${formatCurrency(service.cost)}): Consider Intelligent-Tiering and lifecycle policies.`
        );
        break;
      case 'Amazon Relational Database Service':
        suggestions.push(
          `RDS (${formatCurrency(service.cost)}): Consider right-sizing and Reserved Instances.`
        );
        break;
      default:
        if (service.cost > 500) {
          suggestions.push(
            `${service.name} (${formatCurrency(service.cost)}): Review usage patterns and optimization opportunities.`
          );
        }
    }
  }
  
  return suggestions;
} 