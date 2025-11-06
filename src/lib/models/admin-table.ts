import type {
  ActionBaseConfig,
  ActionFormConfig,
  AdminTablePageConfig,
  BulkActionConfig,
  DataOperationModel,
  DataSourceConfig,
  FilterConfig,
  GlobalActionConfig,
  RowActionConfig,
  TableConfig
} from "../../types/blocks/admin-table";

export interface NormalizedAdminTableConfig {
  dataSource: DataSourceConfig;
  filters: FilterConfig[];
  headerActions: GlobalActionConfig[];
  table: TableConfig;
}

function mergeById<T extends { id: string }>(primary: T[] = [], fallback: T[] = []): T[] {
  if (!primary.length) {
    return fallback.slice();
  }
  if (!fallback.length) {
    return primary.slice();
  }

  const result = primary.slice();
  const existingIds = new Set(primary.map((item) => item.id));

  fallback.forEach((item) => {
    if (!existingIds.has(item.id)) {
      result.push(item);
    }
  });

  return result;
}

function resolveActionForm(
  operation: DataOperationModel,
  formLookup: Map<string, ActionFormConfig>
): ActionFormConfig | undefined {
  if (operation.form) return operation.form;
  if (operation.formRef) {
    return formLookup.get(operation.formRef);
  }
  return undefined;
}

function mergeActions<T extends ActionBaseConfig>(preferred: T[], fallback: T[]): T[] {
  return mergeById(preferred, fallback);
}

function mergeBulkActions(
  preferred: BulkActionConfig[],
  fallback: BulkActionConfig[]
): BulkActionConfig[] {
  return mergeById(preferred, fallback);
}

export function normalizeAdminTableConfig(
  config: AdminTablePageConfig
): NormalizedAdminTableConfig {
  const { models } = config;

  if (!models) {
    if (!config.dataSource) {
      throw new Error("AdminTablePageConfig requires dataSource when models are not provided.");
    }
    if (!config.table) {
      throw new Error(
        "AdminTablePageConfig requires table configuration when models are not provided."
      );
    }
    return {
      dataSource: config.dataSource,
      filters: config.filters ? config.filters.slice() : [],
      headerActions: config.headerActions ? config.headerActions.slice() : [],
      table: {
        ...config.table,
        columns: config.table.columns.slice(),
        rowActions: config.table.rowActions ? config.table.rowActions.slice() : undefined,
        bulkActions: config.table.bulkActions ? config.table.bulkActions.slice() : undefined
      }
    };
  }

  const dataSource = models.view?.dataSource ?? config.dataSource;
  if (!dataSource) {
    throw new Error(
      "AdminTable models require a dataSource defined in models.view or config.dataSource."
    );
  }

  const filtersFromModels = models.filterForms?.flatMap((form) => form.filters ?? []) ?? [];
  const filters = mergeById(filtersFromModels, config.filters ?? []);

  const formLookup = new Map<string, ActionFormConfig>();
  models.submissionForms?.forEach((formModel) => {
    formLookup.set(formModel.id, formModel.form);
  });

  const modelHeaderActions: GlobalActionConfig[] = [];
  const modelRowActions: RowActionConfig[] = [];
  const modelBulkActions: BulkActionConfig[] = [];

  (models.operations ?? []).forEach((operation) => {
    const actionForm = resolveActionForm(operation, formLookup);
    const base: ActionBaseConfig = {
      id: operation.id,
      label: operation.label,
      intent: operation.intent,
      icon: operation.icon,
      confirm: operation.confirm,
      behavior: operation.behavior,
      ...(actionForm ? { form: actionForm } : {})
    };

    switch (operation.scope) {
      case "global":
        modelHeaderActions.push({
          ...base,
          scope: "global"
        });
        break;
      case "row":
        modelRowActions.push({
          ...base,
          scope: "row"
        });
        break;
      case "bulk":
        modelBulkActions.push({
          ...base,
          scope: "bulk",
          requiresSelection: operation.requiresSelection ?? true
        });
        break;
      default:
        break;
    }
  });

  const baseTable = config.table ?? { columns: [] };

  const columns =
    models.view?.columns?.length ? models.view.columns : baseTable.columns;

  if (!columns?.length) {
    throw new Error("AdminTable models require at least one table column configuration.");
  }

  const mergedRowActions = mergeActions(modelRowActions, baseTable.rowActions ?? []);
  const mergedBulkActions = mergeBulkActions(modelBulkActions, baseTable.bulkActions ?? []);

  const table: TableConfig = {
    ...baseTable,
    columns,
    selectable: models.view?.selectable ?? baseTable.selectable,
    pagination: models.view?.pagination ?? baseTable.pagination,
    emptyState: models.view?.emptyState ?? baseTable.emptyState,
    rowActions: mergedRowActions.length ? mergedRowActions : undefined,
    bulkActions: mergedBulkActions.length ? mergedBulkActions : undefined
  };

  const headerActions = mergeActions(modelHeaderActions, config.headerActions ?? []);

  return {
    dataSource,
    filters,
    headerActions,
    table
  };
}
