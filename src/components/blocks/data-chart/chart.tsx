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
  formatValue: (value: number) => string;
}

export function DataChart({ type, items, height, color, formatValue }: DataChartProps) {
  if (!items.length) {
    return null;
  }

  if (type === "line") {
    return (
      <LineChart items={items} height={height} color={color} formatValue={formatValue} />
    );
  }

  return (
    <BarChart items={items} height={height} color={color} formatValue={formatValue} />
  );
}

interface ChartVisualProps {
  items: ChartItem[];
  height: number;
  color: string;
  formatValue: (value: number) => string;
}

function BarChart({ items, height, color, formatValue }: ChartVisualProps) {
  const values = items.map((item) => Math.max(item.value, 0));
  const maxValue = values.length ? Math.max(...values) : 0;
  const safeMaxValue = maxValue <= 0 ? 1 : maxValue;

  return (
    <div
      className="grid items-end gap-4"
      style={{
        gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
        height
      }}
    >
      {items.map((item) => {
        const value = Math.max(item.value, 0);
        const heightPercent = Math.min(100, (value / safeMaxValue) * 100);
        return (
          <div key={item.id} className="flex h-full flex-col items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {formatValue(item.value)}
            </span>
            <div className="flex h-full w-full items-end justify-center">
              <div
                className="w-10 max-w-full rounded-t-md bg-primary/80"
                style={{
                  backgroundColor: color,
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

function LineChart({ items, height, color, formatValue }: ChartVisualProps) {
  const values = items.map((item) => item.value);
  const maxValue = values.length ? Math.max(...values) : 0;
  const minValue = values.length ? Math.min(...values) : 0;
  const range = maxValue - minValue || 1;

  const points = items.map((item, index) => {
    const x = items.length === 1 ? 50 : (index / (items.length - 1)) * 100;
    const y = items.length === 1 ? 50 : ((maxValue - item.value) / range) * 100;
    return `${x},${y}`;
  });

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
        <polyline
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points.join(" ")}
        />
        {items.map((item, index) => {
          const x = items.length === 1 ? 50 : (index / (items.length - 1)) * 100;
          const y = items.length === 1 ? 50 : ((maxValue - item.value) / range) * 100;
          return <circle key={item.id} cx={x} cy={y} r={2.5} fill={color} />;
        })}
      </svg>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => (
          <div key={item.id} className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{formatValue(item.value)}</span>
            <span className="w-full truncate text-center">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
