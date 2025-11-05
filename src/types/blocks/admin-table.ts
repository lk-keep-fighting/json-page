export type Primitive = string | number | boolean | null;

export type FilterType = "text" | "select" | "date-range" | "number" | "boolean";

export interface FilterBaseConfig {
  id: string;
  label: string;
  field: string;
  type: FilterType;
  placeholder?: string;
}

export interface TextFilterConfig extends FilterBaseConfig {
  type: "text" | "number";
}

export interface BooleanFilterConfig extends FilterBaseConfig {
  type: "boolean";
  trueLabel?: string;
  falseLabel?: string;
}

export interface SelectFilterOption {
  label: string;
  value: Primitive;
}

export interface SelectFilterConfig extends FilterBaseConfig {
  type: "select";
  options: SelectFilterOption[];
}

export interface DateRangeFilterConfig extends FilterBaseConfig {
  type: "date-range";
}

export type FilterConfig =
  | TextFilterConfig
  | SelectFilterConfig
  | DateRangeFilterConfig
  | BooleanFilterConfig;

export type SortDirection = "asc" | "desc";

export interface TableColumnConfig {
  id: string;
  label: string;
  dataIndex: string;
  width?: number | string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  renderType?: "text" | "badge" | "boolean" | "date" | "currency" | "custom";
  valueMapping?: Array<{
    value: Primitive;
    label: string;
    variant?: "default" | "secondary" | "outline" | "success" | "warning" | "destructive";
  }>;
  currency?: {
    currency: string;
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  };
  dateFormat?: {
    locale?: string;
    options?: Intl.DateTimeFormatOptions;
  };
}

export interface PaginationConfig {
  defaultPageSize?: number;
  pageSizeOptions?: number[];
}

export type ActionIntent =
  | "default"
  | "secondary"
  | "outline"
  | "destructive"
  | "ghost"
  | "link";

export interface ActionConfirmation {
  title: string;
  description?: string;
}

export interface LinkBehavior {
  type: "link";
  url: string;
  target?: "_blank" | "_self";
}

export interface ApiBehavior {
  type: "api";
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  endpoint: string;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  bodyTemplate?: Record<string, unknown>;
  successMessage?: string;
  errorMessage?: string;
}

export type ActionBehavior = LinkBehavior | ApiBehavior;

export interface ActionBaseConfig {
  id: string;
  label: string;
  intent?: ActionIntent;
  icon?: string;
  confirm?: ActionConfirmation;
  behavior: ActionBehavior;
}

export interface GlobalActionConfig extends ActionBaseConfig {
  scope: "global";
}

export interface RowActionConfig extends ActionBaseConfig {
  scope: "row";
}

export interface BulkActionConfig extends ActionBaseConfig {
  scope: "bulk";
  requiresSelection?: boolean;
}

export interface TableConfig {
  columns: TableColumnConfig[];
  selectable?: boolean;
  rowActions?: RowActionConfig[];
  bulkActions?: BulkActionConfig[];
  pagination?: PaginationConfig;
  emptyState?: {
    title: string;
    description?: string;
  };
}

export interface StaticDataSourceConfig {
  type: "static";
  data: Record<string, Primitive | Primitive[] | Record<string, unknown>>[];
}

export interface RemoteDataSourceConfig {
  type: "remote";
  endpoint: string;
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  requestBody?: Record<string, unknown>;
  pagination?: {
    pageParam?: string;
    pageSizeParam?: string;
  };
  queryMapping?: Record<string, string>;
  responseMapping?: {
    data?: string;
    total?: string;
  };
}

export type DataSourceConfig = StaticDataSourceConfig | RemoteDataSourceConfig;

export interface AdminTablePageConfig {
  type: "admin-table";
  title?: string;
  description?: string;
  dataSource: DataSourceConfig;
  filters?: FilterConfig[];
  headerActions?: GlobalActionConfig[];
  table: TableConfig;
}

export type AdminPageConfig = AdminTablePageConfig;

export interface DataSourceResult {
  data: Record<string, any>[];
  total: number;
}

export interface LoadParams {
  filters: Record<string, unknown>;
  page: number;
  pageSize: number;
  sort?: {
    field: string;
    direction: SortDirection;
  };
}
