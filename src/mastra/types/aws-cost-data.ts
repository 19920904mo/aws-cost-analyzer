/**
 * AWS Cost Explorer API Type Definitions (MVP)
 * Provides type safety for API responses and internal tool data
 */

export interface CostExplorerResponse {
  ResultsByTime: ResultByTime[];
  GroupDefinitions?: GroupDefinition[];
  NextPageToken?: string;
}

export interface ResultByTime {
  TimePeriod: DateInterval;
  Total: { [key: string]: MetricValue };
  Groups: Group[];
  Estimated: boolean;
}

export interface DateInterval {
  Start: string;
  End: string;
}

export interface MetricValue {
  Amount: string;
  Unit: string;
}

export interface Group {
  Keys: string[];
  Metrics: { [key: string]: MetricValue };
}

export interface GroupDefinition {
  Type: string;
  Key: string;
}

/**
 * Processed Cost Data Types (MVP)
 * Standardized types used by agents
 */
export interface ProcessedCostData {
  period: {
    start: string;
    end: string;
  };
  totalCost: number;
  currency: string;
  services: ServiceCostData[];
  trends: TrendData;
  summary: string;
}

export interface ServiceCostData {
  name: string;
  cost: number;
  percentage: number;
  previousPeriodChange?: number;
}

export interface TrendData {
  monthOverMonth?: number;
  trend: 'increasing' | 'decreasing' | 'stable';
} 