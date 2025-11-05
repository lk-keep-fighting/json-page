import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../ui/card";
import { ActionBar } from "./ActionBar";
import { AdminTable } from "./AdminTable";
import { FilterBar } from "./FilterBar";
import { buildBulkActionContext, executeAction } from "./actionExecutor";
import { useDataSource } from "./dataSource";
import type {
  AdminTablePageConfig,
  BulkActionConfig,
  GlobalActionConfig,
  RowActionConfig
} from "./types";

interface LowCodePageProps {
  config: AdminTablePageConfig;
}

export function LowCodePage({ config }: LowCodePageProps) {
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

  const handleGlobalAction = async (action: GlobalActionConfig) => {
    try {
      await executeAction({
        action,
        context: {
          filters: filterValues
        }
      });
      if (action.behavior.type === "api") {
        refetch();
      }
    } catch (error) {
      console.error("执行全局操作失败", error);
    }
  };

  const handleRowAction = async (
    action: RowActionConfig,
    row: Record<string, any>
  ) => {
    try {
      const rawRowId = row.id ?? row.key ?? row.uuid;
      await executeAction({
        action,
        context: {
          row,
          rowId: rawRowId != null ? String(rawRowId) : undefined,
          filters: filterValues
        }
      });
      if (action.behavior.type === "api") {
        refetch();
      }
    } catch (error) {
      console.error("执行行操作失败", error);
    }
  };

  const handleBulkAction = async (
    action: BulkActionConfig,
    rows: Record<string, any>[]
  ) => {
    try {
      await executeAction({
        action,
        context: {
          ...buildBulkActionContext(rows),
          filters: filterValues
        }
      });
      setSelectedRowIds([]);
      if (action.behavior.type === "api") {
        refetch();
      }
    } catch (error) {
      console.error("执行批量操作失败", error);
    }
  };

  return (
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
  );
}
