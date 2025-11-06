import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../../ui/card";
import { ActionBar } from "./action-bar";
import { AdminTable } from "./admin-table";
import { FilterBar } from "./filter-bar";
import { ActionFormDialog } from "./action-form-dialog";
import {
  buildActionTemplateContext,
  buildBulkActionContext,
  executeAction,
  type ActionExecutionContext
} from "../../../lib/actions/executor";
import { useDataSource } from "../../../lib/data-sources/use-data-source";
import type {
  ActionBaseConfig,
  AdminTablePageConfig,
  BulkActionConfig,
  GlobalActionConfig,
  RowActionConfig
} from "../../../types/blocks/admin-table";

interface AdminTableBlockProps {
  config: AdminTablePageConfig;
}

export function AdminTableBlock({ config }: AdminTableBlockProps) {
  const { dataSource, table, filters = [], headerActions = [] } = config;
  const [filterValues, setFilterValues] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    filters.forEach((filter) => {
      if (filter.type === "boolean") {
        initial[filter.id] = "all";
      } else if (filter.type === "date-range") {
        initial[filter.id] = { from: "", to: "" };
      } else {
        initial[filter.id] = "";
      }
    });
    return initial;
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(
    table.pagination?.defaultPageSize ?? 10
  );
  const [sortState, setSortState] = useState<{
    columnId: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [pendingFormAction, setPendingFormAction] = useState<{
    action: ActionBaseConfig;
    context: ActionExecutionContext;
    onSuccess?: () => void;
  } | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const effectiveSort = useMemo(() => {
    if (!sortState) return undefined;
    const column = table.columns.find((item) => item.id === sortState.columnId);
    if (!column) return undefined;
    return {
      field: column.dataIndex,
      direction: sortState.direction
    };
  }, [sortState, table.columns]);

  const { data, total, loading, error, refetch } = useDataSource({
    config: dataSource,
    filters: filterValues,
    filterConfigs: filters,
    page,
    pageSize,
    sort: effectiveSort
  });

  useEffect(() => {
    setSelectedRowIds([]);
  }, [data]);

  const openActionForm = (
    action: ActionBaseConfig,
    context: ActionExecutionContext,
    onSuccess?: () => void
  ) => {
    setPendingFormAction({ action, context, onSuccess });
    setFormSubmitting(false);
    setFormError(null);
  };

  const performAction = async (
    action: ActionBaseConfig,
    context: ActionExecutionContext,
    errorMessage: string,
    extraOnSuccess?: () => void
  ) => {
    const callbacks: Array<() => void> = [];

    if (action.behavior.type === "api") {
      callbacks.push(() => refetch());
    }

    if (extraOnSuccess) {
      callbacks.push(extraOnSuccess);
    }

    const onSuccess =
      callbacks.length > 0
        ? () => {
            callbacks.forEach((callback) => callback());
          }
        : undefined;

    try {
      if (action.form) {
        openActionForm(action, context, onSuccess);
        return;
      }
      await executeAction({ action, context });
      onSuccess?.();
    } catch (error) {
      console.error(errorMessage, error);
    }
  };

  const handleFormClose = () => {
    setPendingFormAction(null);
    setFormSubmitting(false);
    setFormError(null);
  };

  const handleFormSubmit = async (values: Record<string, unknown>) => {
    if (!pendingFormAction) return;
    setFormSubmitting(true);
    setFormError(null);
    try {
      await executeAction({
        action: pendingFormAction.action,
        context: {
          ...pendingFormAction.context,
          formValues: values
        }
      });
      pendingFormAction.onSuccess?.();
      handleFormClose();
    } catch (error) {
      console.error("提交表单操作失败", error);
      setFormError(error instanceof Error ? error.message : String(error));
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleFilterChange = (id: string, value: any) => {
    setFilterValues((prev) => ({ ...prev, [id]: value }));
    setPage(1);
  };

  const handleResetFilters = () => {
    const resetValues: Record<string, any> = {};
    filters.forEach((filter) => {
      if (filter.type === "boolean") {
        resetValues[filter.id] = "all";
      } else if (filter.type === "date-range") {
        resetValues[filter.id] = { from: "", to: "" };
      } else {
        resetValues[filter.id] = "";
      }
    });
    setFilterValues(resetValues);
    setPage(1);
  };

  const handleGlobalAction = (action: GlobalActionConfig) => {
    return performAction(
      action,
      {
        filters: filterValues
      },
      "执行全局操作失败"
    );
  };

  const handleRowAction = (
    action: RowActionConfig,
    row: Record<string, any>
  ) => {
    const rawRowId = row.id ?? row.key ?? row.uuid;
    return performAction(
      action,
      {
        row,
        rowId: rawRowId != null ? String(rawRowId) : undefined,
        filters: filterValues
      },
      "执行行操作失败"
    );
  };

  const handleBulkAction = (
    action: BulkActionConfig,
    rows: Record<string, any>[]
  ) => {
    return performAction(
      action,
      {
        ...buildBulkActionContext(rows),
        filters: filterValues
      },
      "执行批量操作失败",
      () => {
        setSelectedRowIds([]);
      }
    );
  };

  const activeFormConfig = pendingFormAction?.action.form;
  const activeTemplateContext = pendingFormAction
    ? buildActionTemplateContext(pendingFormAction.context)
    : undefined;

  return (
    <>
      <Card className="m-6 overflow-hidden">
        {(config.title || config.description) && (
          <CardHeader>
            {config.title ? <CardTitle>{config.title}</CardTitle> : null}
            {config.description ? (
              <CardDescription>{config.description}</CardDescription>
            ) : null}
          </CardHeader>
        )}
        <ActionBar actions={headerActions} onTrigger={handleGlobalAction} />
        <FilterBar
          filters={filters}
          values={filterValues}
          onChange={handleFilterChange}
          onReset={filters.length ? handleResetFilters : undefined}
        />
        <CardContent className="p-0">
          <AdminTable
            data={data}
            columns={table.columns}
            loading={loading}
            error={error}
            total={total}
            page={page}
            pageSize={pageSize}
            pagination={table.pagination}
            selectable={table.selectable}
            selectedRowIds={selectedRowIds}
            onSelectionChange={setSelectedRowIds}
            sortState={sortState}
            onSortChange={(next) => {
              setSortState(next);
              setPage(1);
            }}
            onPageChange={(nextPage) => setPage(nextPage)}
            onPageSizeChange={(nextSize) => {
              setPageSize(nextSize);
              setPage(1);
            }}
            rowActions={table.rowActions}
            onRowAction={handleRowAction}
            bulkActions={table.bulkActions}
            onBulkAction={handleBulkAction}
            emptyState={table.emptyState}
          />
        </CardContent>
      </Card>
      {activeFormConfig && activeTemplateContext ? (
        <ActionFormDialog
          open={true}
          form={activeFormConfig}
          templateContext={activeTemplateContext}
          submitting={formSubmitting}
          errorMessage={formError}
          onCancel={handleFormClose}
          onSubmit={handleFormSubmit}
        />
      ) : null}
    </>
  );
}
