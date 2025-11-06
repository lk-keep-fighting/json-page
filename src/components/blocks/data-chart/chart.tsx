import type { ChartType } from "../../../types/blocks/data-chart";

interface ChartItem {
  id: string;
  label: string;
  value: number;
}

interface DataChartProps {
  type: ChartType;
  items: ChartItem[];
  height: number;
  color: string;
  colors?: string[];
  formatValue: (value: number) => string;
}

const DEFAULT_COLOR_PALETTE = [
  "#2563eb",
  "#22d3ee",
  "#34d399",
  "#f97316",
  "#facc15",
  "#a855f7",
  "#06b6d4",
  "#f43f5e",
  "#94a3b8",
  "#10b981"
];

const percentageFormatter = new Intl.NumberFormat("zh-CN", {
  style: "percent",
  maximumFractionDigits: 1
});

export function DataChart({ type, items, height, color, colors, formatValue }: DataChartProps) {
  if (!items.length) {
    return null;
  }

  switch (type) {
    case "line":
      return (
        <LineChart
          items={items}
          height={height}
          color={color}
          formatValue={formatValue}
          variant="line"
        />
      );
    case "area":
      return (
        <LineChart
          items={items}
          height={height}
          color={color}
          formatValue={formatValue}
          variant="area"
        />
      );
    case "pie":
      return (
        <PieChart
          items={items}
          height={height}
          color={color}
          colors={colors}
          formatValue={formatValue}
          variant="pie"
        />
      );
    case "doughnut":
      return (
        <PieChart
          items={items}
          height={height}
          color={color}
          colors={colors}
          formatValue={formatValue}
          variant="doughnut"
        />
      );
    default:
      return (
        <BarChart
          items={items}
          height={height}
          color={color}
          colors={colors}
          formatValue={formatValue}
        />
      );
  }
}

interface ChartVisualProps {
  items: ChartItem[];
  height: number;
  color: string;
  colors?: string[];
  formatValue: (value: number) => string;
}

function BarChart({ items, height, color, colors, formatValue }: ChartVisualProps) {
  const values = items.map((item) => Math.max(item.value, 0));
  const maxValue = values.length ? Math.max(...values) : 0;
  const safeMaxValue = maxValue <= 0 ? 1 : maxValue;
  const palette = normalizePalette(colors);

  return (
    <div
      className="grid items-end gap-4"
      style={{
        gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
        height
      }}
    >
      {items.map((item, index) => {
        const value = Math.max(item.value, 0);
        const heightPercent = Math.min(100, (value / safeMaxValue) * 100);
        const barColor = palette.length > 0 ? palette[index % palette.length] : color;

        return (
          <div key={item.id} className="flex h-full flex-col items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {formatValue(item.value)}
            </span>
            <div className="flex h-full w-full items-end justify-center">
              <div
                className="w-10 max-w-full rounded-t-md bg-primary/80"
                style={{
                  backgroundColor: barColor,
                  height: `${heightPercent}%`,
                  minHeight: heightPercent > 0 ? "4px" : "0px"
                }}
              />
            </div>
            <span className="w-full truncate text-center text-xs text-muted-foreground">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

type LineChartVariant = "line" | "area";

function LineChart({ items, height, color, formatValue, variant }: ChartVisualProps & { variant: LineChartVariant }) {
  const values = items.map((item) => item.value);
  const maxValue = values.length ? Math.max(...values) : 0;
  const minValue = values.length ? Math.min(...values) : 0;
  const range = maxValue - minValue || 1;

  const points = items.map((item, index) => {
    const x = items.length === 1 ? 50 : (index / (items.length - 1)) * 100;
    const y = items.length === 1 ? 50 : ((maxValue - item.value) / range) * 100;
    return { id: item.id, x, y };
  });

  const polylinePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPath = variant === "area" ? buildAreaPath(points) : undefined;

  return (
    <div className="flex flex-col gap-3">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ height }}>
        <line
          x1="0"
          y1="100"
          x2="100"
          y2="100"
          stroke="hsl(var(--muted-foreground) / 0.2)"
          strokeWidth={1}
        />
        {variant === "area" && areaPath ? (
          <path d={areaPath} fill={color} fillOpacity={0.2} stroke="none" />
        ) : null}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={polylinePoints}
        />
        {points.map((point) => (
          <circle key={point.id} cx={point.x} cy={point.y} r={2.5} fill={color} />
        ))}
      </svg>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col items-center gap-1 text-xs text-muted-foreground"
          >
            <span className="font-medium text-foreground">{formatValue(item.value)}</span>
            <span className="w-full truncate text-center">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type PieChartVariant = "pie" | "doughnut";

function PieChart({ items, height, color, colors, formatValue, variant }: ChartVisualProps & { variant: PieChartVariant }) {
  const sanitizedItems = items.map((item) => ({
    ...item,
    safeValue: Math.max(item.value, 0)
  }));
  const total = sanitizedItems.reduce((sum, item) => sum + item.safeValue, 0);
  const palette = getSegmentPalette(color, colors);
  const diameter = Math.max(180, height);

  let currentAngle = 0;
  const segments = sanitizedItems.map((item, index) => {
    const ratio = total > 0 ? item.safeValue / total : 1 / sanitizedItems.length;
    const start = currentAngle;
    const end = currentAngle + ratio * 360;
    currentAngle = end;
    return {
      id: item.id,
      label: item.label,
      value: item.safeValue,
      ratio,
      start,
      end,
      color: palette[index % palette.length]
    };
  });

  if (segments.length > 0) {
    segments[segments.length - 1].end = 360;
  }

  const gradientStops =
    segments.length > 0
      ? segments
          .map(
            (segment) =>
              `${segment.color} ${segment.start.toFixed(2)}deg ${segment.end.toFixed(2)}deg`
          )
          .join(", ")
      : `${palette[0]} 0deg 360deg`;

  return (
    <div className="flex flex-col gap-4">
      <div
        className="relative mx-auto flex items-center justify-center"
        style={{ height: diameter, width: diameter }}
      >
        <div
          className="h-full w-full rounded-full border border-border/30 bg-muted/10"
          style={{
            backgroundColor: palette[0],
            backgroundImage: `conic-gradient(${gradientStops})`
          }}
        />
        {variant === "doughnut" ? (
          <div className="absolute flex h-[60%] w-[60%] flex-col items-center justify-center rounded-full bg-background px-4 text-center">
            <span className="text-xs text-muted-foreground">总计</span>
            <span className="text-sm font-semibold text-foreground">
              {formatValue(total)}
            </span>
          </div>
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {segments.map((segment) => (
          <div
            key={segment.id}
            className="flex flex-col gap-1 rounded-md border border-border/60 bg-background/40 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-sm font-medium text-foreground">
                  {segment.label}
                </span>
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {formatPercentage(segment.ratio)}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatValue(segment.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildAreaPath(points: Array<{ x: number; y: number }>): string | undefined {
  if (!points.length) {
    return undefined;
  }

  const commands = [
    `M ${points[0].x} 100`,
    ...points.map((point) => `L ${point.x} ${point.y}`),
    `L ${points[points.length - 1].x} 100`,
    "Z"
  ];

  return commands.join(" ");
}

function normalizePalette(colors?: string[]): string[] {
  if (!Array.isArray(colors)) {
    return [];
  }

  return colors
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);
}

function getSegmentPalette(baseColor: string, colors?: string[]): string[] {
  const normalized = normalizePalette(colors);
  if (normalized.length > 0) {
    return normalized;
  }

  const fallback = [baseColor, ...DEFAULT_COLOR_PALETTE];
  const unique = Array.from(
    new Set(fallback.map((entry) => entry.trim()).filter((entry) => entry.length > 0))
  );

  return unique.length > 0 ? unique : DEFAULT_COLOR_PALETTE;
}

function formatPercentage(value: number): string {
  return percentageFormatter.format(value);
}
