import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type DataSourceConfig,
  type DataSourceResult,
  type FilterConfig,
  type LoadParams,
  type SortDirection
} from "./types";
import { getValueByPath, resolveTemplateValue } from "./utils";

interface UseDataSourceOptions {
  config: DataSourceConfig;
  filters: Record<string, unknown>;
  filterConfigs?: FilterConfig[];
  page: number;
  pageSize: number;
  sort?: {
    field: string;
    direction: SortDirection;
  };
}

interface UseDataSourceResult {
  data: Record<string, any>[];
  total: number;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

function applyFilters(
  data: Record<string, any>[],
  filters: Record<string, unknown>,
  filterConfigs?: FilterConfig[]
) {
  if (!filterConfigs?.length) return data;
  return data.filter((row) =>
    filterConfigs.every((config) => {
      const value = filters[config.id];
      if (value == null || value === "" || (config.type === "boolean" && value === "all")) {
        return true;
      }
      const rowValue = getValueByPath(row, config.field);
      switch (config.type) {
        case "text": {
          return String(rowValue ?? "")
            .toLowerCase()
            .includes(String(value).toLowerCase());
        }
        case "number": {
          const numericValue = Number(value);
          return Number(rowValue) === numericValue;
        }
        case "select": {
          return String(rowValue) === String(value);
        }
        case "boolean": {
          if (value === "true" || value === true) {
            return Boolean(rowValue) === true;
          }
          if (value === "false" || value === false) {
            return Boolean(rowValue) === false;
          }
          return true;
        }
        case "date-range": {
          if (!rowValue) return false;
          const { from, to } = (value ?? {}) as { from?: string; to?: string };
          const rowDate = new Date(rowValue as string).getTime();
          if (Number.isNaN(rowDate)) return false;
          if (from && rowDate < new Date(from).getTime()) return false;
          if (to && rowDate > new Date(to).getTime()) return false;
          return true;
        }
        default:
          return true;
      }
    })
  );
}

function applySort(
  data: Record<string, any>[],
  sort: { field: string; direction: SortDirection } | undefined
) {
  if (!sort) return data;
  const sorted = [...data];
  const { field, direction } = sort;
  sorted.sort((a, b) => {
    const aValue = getValueByPath(a, field);
    const bValue = getValueByPath(b, field);
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return direction === "asc" ? -1 : 1;
    if (bValue == null) return direction === "asc" ? 1 : -1;
    if (aValue > bValue) return direction === "asc" ? 1 : -1;
    if (aValue < bValue) return direction === "asc" ? -1 : 1;
    return 0;
  });
  return sorted;
}

function paginate(
  data: Record<string, any>[],
  page: number,
  pageSize: number
): { pageData: Record<string, any>[]; total: number } {
  const total = data.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return {
    pageData: data.slice(start, end),
    total
  };
}

async function fetchRemoteData(
  config: DataSourceConfig,
  params: LoadParams,
  signal?: AbortSignal
): Promise<DataSourceResult> {
  if (config.type !== "remote") {
    throw new Error("fetchRemoteData can only be used with remote data sources");
  }
  const {
    endpoint,
    method = "GET",
    headers,
    requestBody,
    pagination,
    queryMapping,
    responseMapping
  } = config;

  const query = new URLSearchParams();
  const pageParam = pagination?.pageParam ?? "page";
  const pageSizeParam = pagination?.pageSizeParam ?? "pageSize";

  query.set(pageParam, String(params.page));
  query.set(pageSizeParam, String(params.pageSize));

  if (params.sort?.field) {
    query.set("sortField", params.sort.field);
    query.set("sortDirection", params.sort.direction);
  }

  Object.entries(params.filters).forEach(([key, value]) => {
    if (value == null || value === "") return;
    const mappedKey = queryMapping?.[key] ?? key;
    if (typeof value === "object" && value != null) {
      if ("from" in (value as Record<string, any>) || "to" in (value as Record<string, any>)) {
        const { from, to } = value as { from?: string; to?: string };
        if (from) query.set(`${mappedKey}From`, from);
        if (to) query.set(`${mappedKey}To`, to);
      }
    } else {
      query.set(mappedKey, String(value));
    }
  });

  const queryString = query.toString();
  const url = method === "GET" && queryString ? `${endpoint}?${queryString}` : endpoint;

  const body =
    method !== "GET"
      ? JSON.stringify({
          ...(requestBody ?? {}),
          page: params.page,
          pageSize: params.pageSize,
          filters: params.filters,
          sort: params.sort
        })
      : undefined;

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(headers ?? {})
    },
    body,
    signal
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to load data: ${response.status} ${text}`);
  }

  const payload = await response.json();
  const dataPath = responseMapping?.data ?? "data";
  const totalPath = responseMapping?.total ?? "total";

  const resolvedData = getValueByPath(payload, dataPath) ?? payload;
  const resolvedTotal = getValueByPath(payload, totalPath) ?? (Array.isArray(resolvedData) ? resolvedData.length : 0);

  return {
    data: Array.isArray(resolvedData) ? resolvedData : [],
    total: typeof resolvedTotal === "number" ? resolvedTotal : 0
  };
}

function computeStaticResult(
  config: DataSourceConfig,
  params: LoadParams,
  filterConfigs?: FilterConfig[]
): DataSourceResult {
  if (config.type !== "static") {
    throw new Error("computeStaticResult can only be used with static data sources");
  }
  const filtered = applyFilters(config.data, params.filters, filterConfigs);
  const sorted = applySort(filtered, params.sort);
  const { pageData, total } = paginate(sorted, params.page, params.pageSize);
  return {
    data: pageData,
    total
  };
}

export function useDataSource({
  config,
  filters,
  filterConfigs,
  page,
  pageSize,
  sort
}: UseDataSourceOptions): UseDataSourceResult {
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [reloadIndex, setReloadIndex] = useState(0);

  const params = useMemo<LoadParams>(
    () => ({ filters, page, pageSize, sort }),
    [filters, page, pageSize, sort]
  );

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (config.type === "static") {
          const result = computeStaticResult(config, params, filterConfigs);
          if (!isMounted) return;
          setData(result.data);
          setTotal(result.total);
        } else {
          const result = await fetchRemoteData(config, params, controller.signal);
          if (!isMounted) return;
          setData(result.data);
          setTotal(result.total);
        }
      } catch (err) {
        if (!isMounted) return;
        if ((err as Error).name === "AbortError") {
          return;
        }
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [config, filterConfigs, params, reloadIndex]);

  const refetch = useCallback(() => {
    setReloadIndex((index) => index + 1);
  }, []);

  return { data, total, loading, error, refetch };
}

export function resolveActionPayload(
  template: Record<string, unknown> | undefined,
  context: Record<string, any>
) {
  if (!template) return undefined;
  return resolveTemplateValue(template, context) as Record<string, unknown>;
}
