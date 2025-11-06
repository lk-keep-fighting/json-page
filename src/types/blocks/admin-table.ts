export type Primitive = string | number | boolean | null;

export type RangeValue = {
  from?: string;
  to?: string;
};

export type FilterDefaultValue = Primitive | RangeValue;

export type FilterType = "text" | "select" | "date-range" | "number" | "boolean";

export interface FilterBaseConfig {
  id: string;
  label: string;
  field: string;
  type: FilterType;
  placeholder?: string;
  defaultValue?: FilterDefaultValue;
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

export type ActionFormFieldType = "text" | "number" | "textarea" | "select";

export interface ActionFormFieldBase {
  id: string;
  label: string;
  type: ActionFormFieldType;
  placeholder?: string;
  description?: string;
  required?: boolean;
  defaultValue?: Primitive;
}

export interface TextFormFieldConfig extends ActionFormFieldBase {
  type: "text";
  maxLength?: number;
}

export interface TextareaFormFieldConfig extends ActionFormFieldBase {
  type: "textarea";
  rows?: number;
  maxLength?: number;
}

export interface NumberFormFieldConfig extends ActionFormFieldBase {
  type: "number";
  min?: number;
  max?: number;
  step?: number;
}

export interface SelectFormFieldConfig extends ActionFormFieldBase {
  type: "select";
  options: SelectFilterOption[];
}

export type ActionFormFieldConfig =
  | TextFormFieldConfig
  | TextareaFormFieldConfig
  | NumberFormFieldConfig
  | SelectFormFieldConfig;

export interface ActionFormConfig {
  title?: string;
  description?: string;
  submitLabel?: string;
  cancelLabel?: string;
  fields: ActionFormFieldConfig[];
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
  form?: ActionFormConfig;
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

export interface TableViewModel {
  type: "table-view";
  dataSource: DataSourceConfig;
  columns: TableColumnConfig[];
  selectable?: boolean;
  pagination?: PaginationConfig;
  emptyState?: {
    title: string;
    description?: string;
  };
}

export interface FilterFormModel {
  id: string;
  type: "filter-form";
  filters: FilterConfig[];
}

export interface SubmissionFormModel {
  id: string;
  type: "submission-form";
  form: ActionFormConfig;
}

interface DataOperationModelBase {
  id: string;
  type: "data-operation";
  label: string;
  intent?: ActionIntent;
  icon?: string;
  confirm?: ActionConfirmation;
  behavior: ActionBehavior;
  form?: ActionFormConfig;
  formRef?: string;
}

export interface GlobalOperationModel extends DataOperationModelBase {
  scope: "global";
}

export interface RowOperationModel extends DataOperationModelBase {
  scope: "row";
}

export interface BulkOperationModel extends DataOperationModelBase {
  scope: "bulk";
  requiresSelection?: boolean;
}

export type DataOperationModel =
  | GlobalOperationModel
  | RowOperationModel
  | BulkOperationModel;

export interface AdminTableModelsConfig {
  view: TableViewModel;
  filterForms?: FilterFormModel[];
  submissionForms?: SubmissionFormModel[];
  operations?: DataOperationModel[];
}

export interface AdminTablePageConfig {
  type: "admin-table";
  title?: string;
  description?: string;
  dataSource?: DataSourceConfig;
  filters?: FilterConfig[];
  headerActions?: GlobalActionConfig[];
  table?: TableConfig;
  models?: AdminTableModelsConfig;
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
