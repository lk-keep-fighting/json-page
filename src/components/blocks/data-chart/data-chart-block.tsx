import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../../ui/card";
import { Spinner } from "../../ui/spinner";
import { useDataSource } from "../../../lib/data-sources/use-data-source";
import { getValueByPath } from "../../../lib/utils/template";
import type {
  ChartValueFormatterConfig,
  DataChartBlockConfig
} from "../../../types/blocks/data-chart";
import { DataChart } from "./chart";

interface DataChartBlockProps {
  config: DataChartBlockConfig;
}

function buildValueFormatter(config?: ChartValueFormatterConfig) {
  if (!config) {
    return (value: number) =>
      new Intl.NumberFormat("zh-CN", {
        maximumFractionDigits: 2
      }).format(value);
  }

  if (config.type === "currency") {
    const {
      currency = "CNY",
      locale = "zh-CN",
      maximumFractionDigits,
      minimumFractionDigits
    } = config;
    return (value: number) =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: maximumFractionDigits ?? 2,
        minimumFractionDigits
      }).format(value);
  }

  if (config.type === "percent") {
    const { maximumFractionDigits = 1 } = config;
    return (value: number) => `${(value * 100).toFixed(maximumFractionDigits)}%`;
  }

  const { locale = "zh-CN", maximumFractionDigits, minimumFractionDigits } = config;
  return (value: number) =>
    new Intl.NumberFormat(locale, {
      maximumFractionDigits: maximumFractionDigits ?? 2,
      minimumFractionDigits
    }).format(value);
}

const DEFAULT_COLOR = "hsl(var(--primary))";
const MIN_CHART_HEIGHT = 160;

export function DataChartBlock({ config }: DataChartBlockProps) {
  const { title, description, dataSource, chart, defaultFilters, emptyState } = config;
  const {
    type,
    xField,
    yField,
    color = DEFAULT_COLOR,
    colors,
    height = 260,
    maxItems = 12,
    valueFormatter,
    sort
  } = chart;

  const limit = Math.max(1, Math.floor(maxItems));
  const chartHeight = Math.max(MIN_CHART_HEIGHT, Math.floor(height));
  const filters = defaultFilters ?? {};

  const { data, loading, error } = useDataSource({
    config: dataSource,
    filters,
    page: 1,
    pageSize: limit,
    sort
  });

  const formatValue = useMemo(() => buildValueFormatter(valueFormatter), [valueFormatter]);

  const items = useMemo(
    () =>
      data.map((row, index) => {
        const rawLabel = getValueByPath(row, xField);
        const rawValue = getValueByPath(row, yField);
        const rawId = row?.id ?? row?.key ?? row?.uuid ?? `${index}`;
        const numericValue = typeof rawValue === "number" ? rawValue : Number(rawValue);
        return {
          id: String(rawId),
          label:
            rawLabel == null || rawLabel === ""
              ? `#${index + 1}`
              : String(rawLabel),
          value: Number.isFinite(numericValue) ? numericValue : 0
        };
      }),
    [data, xField, yField]
  );

  return (
    <Card className="m-6">
      {(title || description) && (
        <CardHeader className="pb-2">
          {title ? <CardTitle>{title}</CardTitle> : null}
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
      )}
      <CardContent className="pt-6">
        {loading ? (
          <div className="flex h-[180px] w-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <Spinner className="h-5 w-5" />
            <span>正在加载数据…</span>
          </div>
        ) : error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            加载图表数据失败：{error.message}
          </div>
        ) : !items.length ? (
          <div className="flex h-[180px] w-full flex-col items-center justify-center gap-1 text-center text-sm text-muted-foreground">
            <span>{emptyState?.title ?? "暂无可展示的数据"}</span>
            {emptyState?.description ? (
              <span className="text-xs text-muted-foreground/80">{emptyState.description}</span>
            ) : null}
          </div>
        ) : (
          <DataChart
            type={type}
            items={items}
            height={chartHeight}
            color={color}
            colors={colors}
            formatValue={formatValue}
          />
        )}
      </CardContent>
    </Card>
  );
}
