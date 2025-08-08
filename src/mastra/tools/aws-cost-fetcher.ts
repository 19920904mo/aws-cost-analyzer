/**
 * AWS Cost Explorer API Integration Tool (MVP)
 * Data retrieval from Cost Explorer API, month-over-month comparison, error handling
 */

import { createTool } from '@mastra/core';
import { z } from 'zod';
import { CostExplorerClient, GetCostAndUsageCommand } from '@aws-sdk/client-cost-explorer';
// Using chrono-node for robust natural language date parsing
// Demonstrates integration of industry-standard libraries with Mastra
import * as chrono from 'chrono-node';
import type { CostExplorerResponse, ProcessedCostData, ServiceCostData, TrendData } from '../types/aws-cost-data.js';
import {
  calculatePercentageChange,
  determineTrend,
  generateCostSummary
} from '../utils/cost-calculations.js';
import { getMonthRange, getCurrentDate } from '../utils/date-helpers.js';
import { handleAWSError } from '../utils/error-handlers.js';
import { log } from '../utils/logger.js';
import { env } from '../config/env.js';


/**
 * AWS Cost Fetcher Tool (MVP)
 * Data retrieval functionality for natural language cost queries
 */
export const awsCostFetcher = createTool({
  id: 'aws-cost-fetcher',
  description: 'Dynamically calculate dates from user natural language queries and retrieve & analyze cost data from AWS Cost Explorer API',
  inputSchema: z.object({
    userQuery: z.string().describe('User natural language query (e.g., "What\'s this month\'s AWS cost?")')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    data: z.object({
      period: z.object({ start: z.string(), end: z.string() }),
      totalCost: z.number(),
      currency: z.string(),
      services: z.array(z.object({
        name: z.string(),
        cost: z.number(),
        percentage: z.number(),
        previousPeriodChange: z.number().optional()
      })),
      trends: z.object({
        monthOverMonth: z.number().optional(),
        trend: z.enum(['increasing', 'decreasing', 'stable'])
      }),
      summary: z.string()
    }).optional(),
    error: z.string().optional()
  }),

  execute: async ({ context }) => {
    try {
      // Environment variables are already validated by Zod in env.ts
      const { userQuery } = context;

      log.debug('Context details', { userQuery }, '🧪');
      const extractedPeriod = extractPeriodFromQuery(userQuery);
      
      log.info('Period calculation result', { extractedPeriod }, '🔍');
      
      log.info('Date calculation result', {
        userQuery,
        extractedPeriod,
        currentDate: getCurrentDate()
      }, '🕐');

      // Initialize Cost Explorer client using type-safe env
      const client = new CostExplorerClient({
        region: env.AWS_DEFAULT_REGION,
        credentials: {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY
        }
      });

      // Retrieve current period data
      const currentPeriodData = await fetchCostData(
        client, 
        extractedPeriod.start, 
        extractedPeriod.end, 
        'MONTHLY',
        ['SERVICE']
      );

      // Retrieve previous month data (for comparison)
      const previousPeriodData = await fetchPreviousPeriodData(
        client,
        extractedPeriod.start,
        extractedPeriod.end,
        'MONTHLY',
        ['SERVICE']
      );

      // Process and analyze data
      const processedData = await processAndAnalyzeCostData(
        currentPeriodData,
        previousPeriodData,
        extractedPeriod
      );

      return {
        success: true,
        data: processedData
      };

    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      log.error('AWS Cost Fetcher Error', { error: err.message, stack: err.stack }, '🚨');
      
      // Handle AWS-specific errors
      if (err.name === 'ValidationException') {
        return {
          success: false,
          error: `AWS Cost Explorer data limitation: ${err.message}`
        };
      }

      const errorResponse = handleAWSError(err);
      return {
        success: false,
        error: errorResponse.error
      };
    }
  }
});

/**
 * Retrieve data from Cost Explorer API
 */
async function fetchCostData(
  client: CostExplorerClient,
  startDate: string,
  endDate: string,
  granularity: 'MONTHLY',
  groupBy: string[]
): Promise<CostExplorerResponse> {
  const command = new GetCostAndUsageCommand({
    TimePeriod: {
      Start: startDate,
      End: endDate
    },
    Granularity: granularity,
    Metrics: ['UnblendedCost'],
    GroupBy: groupBy.map(key => ({
      Type: 'DIMENSION',
      Key: key
    }))
  });

  const response = await client.send(command);
  
  // Calculate total from individual services if API Total is 0
  const result = response as CostExplorerResponse;
  if (result.ResultsByTime?.[0]?.Total?.UnblendedCost?.Amount === '0') {
    let calculatedTotal = 0;
    if (result.ResultsByTime?.[0]?.Groups) {
      for (const group of result.ResultsByTime[0].Groups) {
        calculatedTotal += parseFloat(group.Metrics?.UnblendedCost?.Amount || '0');
      }
    }
    log.debug('API Total was 0, calculated from services', { 
      apiTotal: 0, 
      calculatedTotal,
      serviceCount: result.ResultsByTime?.[0]?.Groups?.length || 0
    }, '🔧');
  }
  
  return result;
}

/**
 * Retrieve previous period data (for comparison)
 */
async function fetchPreviousPeriodData(
  client: CostExplorerClient,
  startDate: string,
  endDate: string,
  granularity: 'MONTHLY',
  groupBy: string[]
): Promise<CostExplorerResponse> {
  // Calculate period difference
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate previous period start and end dates
  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - daysDiff + 1);

  const prevStartStr = prevStart.toISOString().split('T')[0];
  const prevEndStr = prevEnd.toISOString().split('T')[0];

  log.debug('Previous period calculation', {
    currentPeriod: { start: startDate, end: endDate },
    previousPeriod: { start: prevStartStr, end: prevEndStr },
    daysDiff
  }, '📊');

  return fetchCostData(
    client,
    prevStartStr,
    prevEndStr,
    granularity,
    groupBy
  );
}

/**
 * Process and analyze cost data
 */
async function processAndAnalyzeCostData(
  currentData: CostExplorerResponse,
  previousData: CostExplorerResponse,
  period: { start: string; end: string }
): Promise<ProcessedCostData> {
  // Process current period data
  const currentResults = currentData.ResultsByTime?.[0];
  const apiTotalCost = parseFloat(currentResults?.Total?.UnblendedCost?.Amount || '0');
  const currency = currentResults?.Total?.UnblendedCost?.Unit || 'USD';
  
  log.api('API Total Cost', { apiTotalCost, currency });

  // Process previous period data
  const previousResults = previousData.ResultsByTime?.[0];
  let previousTotalCost = parseFloat(previousResults?.Total?.UnblendedCost?.Amount || '0');
  
  // If previous period API Total is 0, calculate from individual services
  if (previousTotalCost === 0 && previousResults?.Groups) {
    previousTotalCost = 0;
    for (const group of previousResults.Groups) {
      previousTotalCost += parseFloat(group.Metrics?.UnblendedCost?.Amount || '0');
    }
    log.debug('Previous period API Total was 0, calculated from services', { 
      apiTotal: 0, 
      calculatedTotal: previousTotalCost,
      serviceCount: previousResults.Groups.length
    }, '🔧');
  }

  log.info('Previous period total cost', { 
    previousTotalCost, 
    currentApiTotalCost: apiTotalCost,
    previousPeriodGroups: previousResults?.Groups?.length || 0
  }, '📊');

  // Process service data for all services
  const services: ServiceCostData[] = [];
  let calculatedTotalCost = 0; // Calculate using sum of individual services
  
  log.info('Processing all services', { totalGroups: currentResults?.Groups?.length || 0 }, '🔍');
  
  if (currentResults?.Groups) {
    for (const group of currentResults.Groups) {
      const serviceName = group.Keys?.[0] || 'Unknown';
      
      const serviceCost = parseFloat(group.Metrics?.UnblendedCost?.Amount || '0');
      calculatedTotalCost += serviceCost;

      // Get previous period cost for the same service
      const previousServiceGroup = previousResults?.Groups?.find(
        g => g.Keys?.[0] === serviceName
      );
      const previousServiceCost = parseFloat(
        previousServiceGroup?.Metrics?.UnblendedCost?.Amount || '0'
      );

      const previousPeriodChange = previousServiceCost > 0 
        ? calculatePercentageChange(serviceCost, previousServiceCost)
        : (serviceCost > 0 ? 100 : 0);

      services.push({
        name: serviceName,
        cost: serviceCost,
        percentage: 0, // Calculate later
        previousPeriodChange
      });
    }
  }

  // Use API total cost if available, otherwise use calculated total
  const totalCost = apiTotalCost > 0 ? apiTotalCost : calculatedTotalCost;
  
  log.cost('Total cost calculation', { 
    apiTotalCost, 
    calculatedTotalCost, 
    finalTotalCost: totalCost,
    serviceCount: services.length
  });

  // Calculate percentage for each service correctly
  services.forEach(service => {
    service.percentage = totalCost > 0 ? (service.cost / totalCost) * 100 : 0;
  });

  // Trend analysis
  const monthOverMonth = previousTotalCost > 0 
    ? calculatePercentageChange(totalCost, previousTotalCost)
    : (totalCost > 0 ? 100 : 0);

  log.debug('Month-over-month calculation', {
    currentTotalCost: totalCost,
    previousTotalCost,
    monthOverMonth,
    calculationUsed: previousTotalCost > 0 ? 'percentage_change' : 'fallback_100%'
  }, '📊');

  const trends: TrendData = {
    monthOverMonth,
    trend: determineTrend(monthOverMonth)
  };

  // Temporary data for summary generation
  const tempData = {
    period,
    totalCost,
    currency,
    services: services.sort((a, b) => b.cost - a.cost), // Sort by cost
    trends,
    summary: '' // Temporary value
  };

  const summary = generateCostSummary(tempData);

  return {
    ...tempData,
    summary
  };
} 

/**
 * Extract period from user query using chrono-node (natural language date parser)
 * 
 * Benefits of using chrono-node:
 * - Industry-standard natural language date parsing (Trust Score 9.3)
 * - Supports unlimited date patterns vs manual regex implementation
 * - Demonstrates best practice: leveraging specialized libraries
 * - Provides robust, battle-tested date interpretation
 * 
 * Supported patterns: "May 2025", "last month", "January", "next Friday", etc.
 */
function extractPeriodFromQuery(query: string): { start: string; end: string } {
  log.debug('extractPeriodFromQuery function called', { query }, '🚨');
  
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // ① If the user explicitly mentions a year (e.g. "May 2023"), skip month-only logic
  const hasYear = /\b\d{4}\b/.test(query);
  log.debug('Year detection', { hasYear, query }, '📅');
  
  // ② Month-only (no year) → force currentYear
  if (!hasYear) {
    const monthOnlyMatch = query.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/i);
    if (monthOnlyMatch) {
      const monthName = monthOnlyMatch[1];
      log.debug('Month-only pattern detected (no year)', { monthName, forcedYear: currentYear }, '📅');
      
      // Convert month name to 1–12 using current year
      const monthIndex = new Date(`${monthName} 1, ${currentYear}`).getMonth() + 1;
      
      // Forcibly calculate that month in the current year
      const start = `${currentYear}-${String(monthIndex).padStart(2, '0')}-01`;
      const endDay = new Date(currentYear, monthIndex, 0).getDate();
      const end = `${currentYear}-${String(monthIndex).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
      
      log.debug('Month-only with forced current year', { 
        monthName, 
        monthIndex, 
        currentYear, 
        period: { start, end } 
      }, '📅');
      return { start, end };
    }
  }
  
  // ③ Explicit year+month/day or any other natural-language → let chrono handle it
  const parsed = chrono.parse(query, now, { forwardDate: false });
  if (parsed.length) {
    const span = parsed[0];
    const year = span.start.get('year');
    const month = span.start.get('month');
    const day = span.start.get('day');
    
    log.debug('Chrono-node full parse result', { year, month, day }, '📅');
    
    // If chrono saw year+month but no day, treat as whole month
    if (year && month && !span.start.isCertain('day')) {
      const start = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDay = new Date(year, month, 0).getDate();
      const end = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
      
      log.debug('Chrono-node year+month (whole month)', { 
        year, 
        month, 
        period: { start, end } 
      }, '📅');
      return { start, end };
    }
    
    // If it parsed a full date (with day), treat as single-day period
    if (span.start.isCertain('day')) {
      const d = span.start.date();
      const iso = d.toISOString().split('T')[0];
      log.debug('Chrono-node single day', { start: iso, end: iso }, '📅');
      return { start: iso, end: iso };
    }
  }
  
  // Fallback: try to detect relative patterns manually
  const lowerQuery = query.toLowerCase();
  
  // Handle "this month" / "current month"
  if (lowerQuery.includes('this month') || lowerQuery.includes('current month')) {
    const period = getMonthRange(0);
    log.debug('This month detected (fallback)', period, '📅');
    return period;
  }
  
  // Handle "last month" / "previous month"
  if (lowerQuery.includes('last month') || lowerQuery.includes('previous month')) {
    const period = getMonthRange(-1);
    log.debug('Last month detected (fallback)', period, '📅');
    return period;
  }
  
  // Default to this month
  const period = getMonthRange(0);
  log.debug('Default (this month)', period, '📅');
  return period;
}
