import type { ChangeEvent } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import type { FilterConfig } from "./types";

interface FilterBarProps {
  filters?: FilterConfig[];
  values: Record<string, any>;
  onChange: (id: string, value: any) => void;
  onReset?: () => void;
}

export function FilterBar({ filters = [], values, onChange, onReset }: FilterBarProps) {
  if (!filters.length) return null;

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>, id: string) => {
    onChange(id, event.target.value);
  };

  const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>, id: string) => {
    onChange(id, event.target.value);
  };

  return (
    <div className="flex flex-wrap gap-4 border-b border-border bg-muted/40 p-4">
      {filters.map((filter) => {
        const rawValue = values[filter.id];
        switch (filter.type) {
          case "text":
          case "number": {
            const value = rawValue ?? "";
            return (
              <div key={filter.id} className="flex min-w-[220px] flex-col gap-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {filter.label}
                </label>
                <Input
                  type={filter.type === "number" ? "number" : "text"}
                  placeholder={filter.placeholder}
                  value={value}
                  onChange={(event) => handleInputChange(event, filter.id)}
                />
              </div>
            );
          }
          case "select": {
            const value = rawValue == null ? "" : String(rawValue);
            return (
              <div key={filter.id} className="flex min-w-[220px] flex-col gap-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {filter.label}
                </label>
                <Select
                  value={value}
                  onChange={(event) => handleSelectChange(event, filter.id)}
                >
                  <option value="">全部</option>
                  {filter.options.map((option) => (
                    <option key={String(option.value)} value={String(option.value)}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
            );
          }
          case "boolean": {
            const value = rawValue ?? "all";
            return (
              <div key={filter.id} className="flex min-w-[220px] flex-col gap-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {filter.label}
                </label>
                <Select
                  value={value}
                  onChange={(event) => handleSelectChange(event, filter.id)}
                >
                  <option value="all">全部</option>
                  <option value="true">{filter.trueLabel ?? "是"}</option>
                  <option value="false">{filter.falseLabel ?? "否"}</option>
                </Select>
              </div>
            );
          }
          case "date-range": {
            const value =
              typeof rawValue === "object" && rawValue != null
                ? (rawValue as { from?: string; to?: string })
                : { from: "", to: "" };
            return (
              <div key={filter.id} className="flex min-w-[280px] flex-col gap-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {filter.label}
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={value.from ?? ""}
                    onChange={(event) =>
                      onChange(filter.id, {
                        ...value,
                        from: event.target.value
                      })
                    }
                  />
                  <span className="text-muted-foreground">至</span>
                  <Input
                    type="date"
                    value={value.to ?? ""}
                    onChange={(event) =>
                      onChange(filter.id, {
                        ...value,
                        to: event.target.value
                      })
                    }
                  />
                </div>
              </div>
            );
          }
          default:
            return null;
        }
      })}
      {onReset ? (
        <div className="ml-auto self-end">
          <Button variant="ghost" size="sm" onClick={onReset}>
            重置
          </Button>
        </div>
      ) : null}
    </div>
  );
}
