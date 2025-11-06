import { useMemo } from "react";
import { AdminTableBlock } from "../admin-table/admin-table-block";
import type {
  ActionFormConfig,
  ActionFormFieldConfig,
  AdminTablePageConfig,
  ApiBehavior,
  GlobalActionConfig,
  RowActionConfig,
  TableColumnConfig,
  TableConfig
} from "../../../types/blocks/admin-table";
import type {
  CrudActionConfig,
  DataManagementBlockConfig
} from "../../../types/blocks/data-management";

const DEFAULT_BASE_ENDPOINT = "/api/resources";
const DEFAULT_RESOURCE_FALLBACK = "数据";
const DEFAULT_CREATE_ACTION_ID = "__data_management_create";
const DEFAULT_UPDATE_ACTION_ID = "__data_management_update";
const DEFAULT_DELETE_ACTION_ID = "__data_management_delete";

interface FieldDefinition {
  field: ActionFormFieldConfig;
  dataPath: string;
}

function sanitizeFieldId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function ensureUniqueId(baseId: string, used: Set<string>, fallbackIndex: number) {
  const normalized = baseId.length ? baseId : `field_${fallbackIndex}`;
  let candidate = normalized;
  let suffix = 1;
  while (used.has(candidate)) {
    candidate = `${normalized}_${suffix}`;
    suffix += 1;
  }
  used.add(candidate);
  return candidate;
}

function setNestedValue(target: Record<string, unknown>, path: string, value: unknown) {
  if (!path) {
    return;
  }
  const segments = path.split(".");
  let current: Record<string, unknown> = target;
  segments.forEach((segment, index) => {
    if (index === segments.length - 1) {
      current[segment] = value;
      return;
    }
    const existing = current[segment];
    if (!existing || typeof existing !== "object") {
      current[segment] = {};
    }
    current = current[segment] as Record<string, unknown>;
  });
}

function buildSelectField(
  fieldId: string,
  label: string,
  placeholder: string,
  options: Array<{ label: string; value: any }>,
  defaultValue?: string
): ActionFormFieldConfig {
  return {
    id: fieldId,
    label,
    type: "select",
    placeholder,
    options,
    ...(defaultValue ? { defaultValue } : {})
  };
}

function buildNumberField(
  fieldId: string,
  label: string,
  placeholder: string,
  defaultValue?: string
): ActionFormFieldConfig {
  return {
    id: fieldId,
    label,
    type: "number",
    placeholder,
    ...(defaultValue ? { defaultValue } : {})
  };
}

function buildTextField(
  fieldId: string,
  label: string,
  placeholder: string,
  defaultValue?: string
): ActionFormFieldConfig {
  return {
    id: fieldId,
    label,
    type: "text",
    placeholder,
    ...(defaultValue ? { defaultValue } : {})
  };
}

function buildFieldFromColumn(
  column: TableColumnConfig,
  fieldId: string,
  variant: "create" | "update"
): ActionFormFieldConfig {
  const label = column.label ?? column.dataIndex ?? column.id;
  const defaultValue = variant === "update" && column.dataIndex ? `{{row.${column.dataIndex}}}` : undefined;

  if (column.valueMapping && column.valueMapping.length) {
    return buildSelectField(
      fieldId,
      label,
      `请选择${label}`,
      column.valueMapping.map((item) => ({
        label: item.label,
        value: item.value
      })),
      defaultValue
    );
  }

  if (column.renderType === "boolean") {
    return buildSelectField(
      fieldId,
      label,
      `请选择${label}`,
      [
        { label: "是", value: true },
        { label: "否", value: false }
      ],
      defaultValue
    );
  }

  if (column.renderType === "currency") {
    return buildNumberField(fieldId, label, `请输入${label}`, defaultValue);
  }

  return buildTextField(fieldId, label, `请输入${label}`, defaultValue);
}

function createFieldDefinitions(
  columns: TableColumnConfig[],
  idField: string,
  variant: "create" | "update"
): FieldDefinition[] {
  const used = new Set<string>();
  const definitions: FieldDefinition[] = [];

  columns.forEach((column, index) => {
    if (!column.dataIndex) return;
    if (column.dataIndex === idField) return;

    const baseId = sanitizeFieldId(column.dataIndex || column.id || "");
    const fieldId = ensureUniqueId(baseId, used, index + 1);
    const field = buildFieldFromColumn(column, fieldId, variant);
    definitions.push({ field, dataPath: column.dataIndex });
  });

  return definitions;
}

function buildBodyTemplateFromDefinitions(
  definitions: FieldDefinition[],
  options?: { includeRowId?: string }
): Record<string, unknown> {
  const template: Record<string, unknown> = {};
  definitions.forEach(({ dataPath, field }) => {
    setNestedValue(template, dataPath, `{{formValues.${field.id}}}`);
  });
  if (options?.includeRowId) {
    setNestedValue(template, options.includeRowId, `{{row.${options.includeRowId}}}`);
  }
  return template;
}

function buildBodyTemplateFromForm(form: ActionFormConfig): Record<string, unknown> {
  const template: Record<string, unknown> = {};
  form.fields.forEach((field) => {
    setNestedValue(template, field.id, `{{formValues.${field.id}}}`);
  });
  return template;
}

function buildDefaultCreateAction(
  crud: CrudActionConfig | undefined,
  columns: TableColumnConfig[],
  idField: string,
  baseEndpoint: string,
  resourceName: string
): GlobalActionConfig | undefined {
  if (crud?.enabled === false) {
    return undefined;
  }

  const definitions = crud?.form ? [] : createFieldDefinitions(columns, idField, "create");
  const form: ActionFormConfig = crud?.form ?? {
    title: `新建${resourceName}`,
    submitLabel: "保存",
    cancelLabel: "取消",
    fields: definitions.map((item) => item.field)
  };

  const behavior: ApiBehavior = {
    type: "api",
    method: crud?.api?.method ?? "POST",
    endpoint: crud?.api?.endpoint ?? baseEndpoint,
    headers: crud?.api?.headers,
    successMessage: crud?.api?.successMessage ?? `新增${resourceName}成功`,
    errorMessage: crud?.api?.errorMessage,
    bodyTemplate:
      crud?.api?.bodyTemplate ??
      (crud?.form ? buildBodyTemplateFromForm(form) : buildBodyTemplateFromDefinitions(definitions))
  };

  return {
    id: crud?.id ?? DEFAULT_CREATE_ACTION_ID,
    label: crud?.label ?? `新建${resourceName}`,
    scope: "global",
    intent: crud?.intent ?? "default",
    behavior,
    form
  };
}

function buildDefaultUpdateAction(
  crud: CrudActionConfig | undefined,
  columns: TableColumnConfig[],
  idField: string,
  baseEndpoint: string,
  resourceName: string
): RowActionConfig | undefined {
  if (crud?.enabled === false) {
    return undefined;
  }

  const definitions = crud?.form ? [] : createFieldDefinitions(columns, idField, "update");
  const form: ActionFormConfig = crud?.form ?? {
    title: `编辑${resourceName}`,
    submitLabel: "保存",
    cancelLabel: "取消",
    fields: definitions.map((item) => item.field)
  };

  const behavior: ApiBehavior = {
    type: "api",
    method: crud?.api?.method ?? "PUT",
    endpoint: crud?.api?.endpoint ?? `${baseEndpoint}/{{rowId}}`,
    headers: crud?.api?.headers,
    successMessage: crud?.api?.successMessage ?? `更新${resourceName}成功`,
    errorMessage: crud?.api?.errorMessage,
    bodyTemplate:
      crud?.api?.bodyTemplate ??
      (crud?.form
        ? buildBodyTemplateFromForm(form)
        : buildBodyTemplateFromDefinitions(definitions, { includeRowId: idField }))
  };

  return {
    id: crud?.id ?? DEFAULT_UPDATE_ACTION_ID,
    label: crud?.label ?? "编辑",
    scope: "row",
    intent: crud?.intent ?? "ghost",
    behavior,
    form
  };
}

function buildDefaultDeleteAction(
  crud: CrudActionConfig | undefined,
  baseEndpoint: string,
  resourceName: string
): RowActionConfig | undefined {
  if (crud?.enabled === false) {
    return undefined;
  }

  const behavior: ApiBehavior = {
    type: "api",
    method: crud?.api?.method ?? "DELETE",
    endpoint: crud?.api?.endpoint ?? `${baseEndpoint}/{{rowId}}`,
    headers: crud?.api?.headers,
    successMessage: crud?.api?.successMessage ?? `删除${resourceName}成功`,
    errorMessage: crud?.api?.errorMessage,
    bodyTemplate: crud?.api?.bodyTemplate
  };

  return {
    id: crud?.id ?? DEFAULT_DELETE_ACTION_ID,
    label: crud?.label ?? "删除",
    scope: "row",
    intent: crud?.intent ?? "destructive",
    confirm:
      crud?.confirm ?? {
        title: `确认删除该${resourceName}？`
      },
    behavior,
    ...(crud?.form ? { form: crud.form } : {})
  };
}

export function DataManagementBlock({ config }: { config: DataManagementBlockConfig }) {
  const adminTableConfig = useMemo<AdminTablePageConfig>(() => {
    const {
      crud,
      type: _ignored,
      models: _ignoredModels,
      headerActions: customHeaderActions = [],
      table,
      ...rest
    } = config;
    const idField = crud?.idField ?? "id";
    const derivedBaseEndpoint =
      crud?.baseEndpoint ??
      (config.dataSource.type === "remote" ? config.dataSource.endpoint : undefined) ??
      DEFAULT_BASE_ENDPOINT;
    const resourceName = config.title ?? DEFAULT_RESOURCE_FALLBACK;
    const baseTable: TableConfig = table ?? { columns: [] };
    const columns = baseTable.columns ?? [];

    const createAction = buildDefaultCreateAction(crud?.create, columns, idField, derivedBaseEndpoint, resourceName);
    const updateAction = buildDefaultUpdateAction(crud?.update, columns, idField, derivedBaseEndpoint, resourceName);
    const deleteAction = buildDefaultDeleteAction(crud?.delete, derivedBaseEndpoint, resourceName);

    const headerActionIds = new Set<string | undefined>([createAction?.id]);
    const headerActions = [
      ...(createAction ? [createAction] : []),
      ...customHeaderActions.filter((action) => !headerActionIds.has(action.id))
    ];

    const excludedRowIds = new Set<string | undefined>([updateAction?.id, deleteAction?.id]);
    const rowActions = [
      ...(updateAction ? [updateAction] : []),
      ...(deleteAction ? [deleteAction] : []),
      ...(baseTable.rowActions ?? []).filter((action) => !excludedRowIds.has(action.id))
    ];

    return {
      ...rest,
      type: "admin-table",
      headerActions,
      table: {
        ...baseTable,
        rowActions,
        bulkActions: baseTable.bulkActions
      }
    } satisfies AdminTablePageConfig;
  }, [config]);

  return <AdminTableBlock config={adminTableConfig} />;
}
