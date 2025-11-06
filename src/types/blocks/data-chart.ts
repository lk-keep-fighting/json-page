import type { DataSourceConfig, SortDirection } from "./admin-table";

export type ChartType = "bar" | "line";

export interface ChartSortConfig {
  field: string;
  direction: SortDirection;
}

export interface ChartValueFormatterConfig {
  type: "number" | "percent" | "currency";
  currency?: string;
  locale?: string;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
}

export interface ChartConfig {
  type: ChartType;
  xField: string;
  yField: string;
  sort?: ChartSortConfig;
  color?: string;
  height?: number;
  maxItems?: number;
  valueFormatter?: ChartValueFormatterConfig;
}

export interface EmptyStateConfig {
  title: string;
  description?: string;
}

export interface DataChartBlockConfig {
  type: "data-chart";
  title?: string;
  description?: string;
  dataSource: DataSourceConfig;
  defaultFilters?: Record<string, unknown>;
  chart: ChartConfig;
  emptyState?: EmptyStateConfig;
}
