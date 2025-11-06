import type {
  ActionConfirmation,
  ActionFormConfig,
  ActionIntent,
  AdminTablePageConfig
} from "./admin-table";

export type CrudHttpMethod = "POST" | "PUT" | "PATCH" | "DELETE";

export interface CrudActionApiConfig {
  endpoint?: string;
  method?: CrudHttpMethod;
  headers?: Record<string, string>;
  successMessage?: string;
  errorMessage?: string;
  bodyTemplate?: Record<string, unknown>;
}

export interface CrudActionConfig {
  id?: string;
  label?: string;
  intent?: ActionIntent;
  confirm?: ActionConfirmation;
  form?: ActionFormConfig;
  api?: CrudActionApiConfig;
  enabled?: boolean;
}

export interface DataManagementCrudConfig {
  idField?: string;
  baseEndpoint?: string;
  create?: CrudActionConfig;
  update?: CrudActionConfig;
  delete?: CrudActionConfig;
}

export interface DataManagementBlockConfig extends Omit<AdminTablePageConfig, "type"> {
  type: "data-management";
  crud?: DataManagementCrudConfig;
}
