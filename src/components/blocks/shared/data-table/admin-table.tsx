import { Badge } from "../../../ui/badge";
import { Button } from "../../../ui/button";
import { Checkbox } from "../../../ui/checkbox";
import { Spinner } from "../../../ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../../../ui/table";
import { getValueByPath } from "../../../../lib/utils/template";
import type {
  BulkActionConfig,
  PaginationConfig,
  RowActionConfig,
  SortDirection,
  TableColumnConfig
} from "../../../../types/blocks/admin-table";

interface SortState {
  columnId: string;
  direction: SortDirection;
}

interface AdminTableProps {
  data: Record<string, any>[];
  columns: TableColumnConfig[];
  loading: boolean;
  error: Error | null;
  total: number;
  page: number;
  pageSize: number;
  pagination?: PaginationConfig;
  selectable?: boolean;
  selectedRowIds: string[];
  onSelectionChange: (ids: string[]) => void;
  sortState?: SortState | null;
  onSortChange?: (sort: SortState | null) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  rowActions?: RowActionConfig[];
  onRowAction?: (action: RowActionConfig, row: Record<string, any>) => void;
  bulkActions?: BulkActionConfig[];
  onBulkAction?: (action: BulkActionConfig, rows: Record<string, any>[]) => void;
  emptyState?: {
    title: string;
    description?: string;
  };
  getRowId?: (row: Record<string, any>, index: number) => string;
}

function toButtonVariant(intent: RowActionConfig["intent"]) {
  switch (intent) {
    case "secondary":
      return "secondary" as const;
    case "outline":
      return "outline" as const;
    case "destructive":
      return "destructive" as const;
    case "ghost":
      return "ghost" as const;
    case "link":
      return "link" as const;
    default:
      return "default" as const;
  }
}

const alignmentClassMap: Record<"left" | "center" | "right", string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right"
};

function getAlignmentClass(align?: "left" | "center" | "right") {
  return align ? alignmentClassMap[align] : undefined;
}

function renderCell(
  column: TableColumnConfig,
  row: Record<string, any>
) {
  const rawValue = getValueByPath(row, column.dataIndex);
  if (column.renderType === "badge") {
    const mapping = column.valueMapping?.find(
      (item) => String(item.value) === String(rawValue)
    );
    if (mapping) {
      return <Badge variant={mapping.variant ?? "default"}>{mapping.label}</Badge>;
    }
    return (
      <Badge variant="secondary">
        {rawValue == null || rawValue === "" ? "-" : String(rawValue)}
      </Badge>
    );
  }

  if (column.renderType === "boolean") {
    const isTrue = Boolean(rawValue);
    return (
      <Badge variant={isTrue ? "success" : "secondary"}>{isTrue ? "是" : "否"}</Badge>
    );
  }

  if (column.renderType === "date" && rawValue) {
    const options = column.dateFormat?.options ?? {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    };
    try {
      const formatter = new Intl.DateTimeFormat(column.dateFormat?.locale ?? "zh-CN", options);
      return formatter.format(new Date(rawValue));
    } catch (error) {
      return String(rawValue);
    }
  }

  if (column.renderType === "currency" && typeof rawValue === "number") {
    const formatter = new Intl.NumberFormat(column.currency?.locale ?? "zh-CN", {
      style: "currency",
      currency: column.currency?.currency ?? "CNY",
      minimumFractionDigits: column.currency?.minimumFractionDigits ?? 2,
      maximumFractionDigits: column.currency?.maximumFractionDigits ?? 2
    });
    return formatter.format(rawValue);
  }

  return rawValue == null || rawValue === "" ? "-" : String(rawValue);
}

function PaginationControls({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50]
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
}) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground md:flex-row">
      <div>
        共 {total} 条记录 · 第 {page}/{totalPages} 页
      </div>
      <div className="flex items-center gap-2">
        <span>每页</span>
        <select
          className="h-9 rounded-md border border-input bg-background px-2"
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <Button
          variant="outline"
          size="sm"
          disabled={!canPrev}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          上一页
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!canNext}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          下一页
        </Button>
      </div>
    </div>
  );
}

export function AdminTable({
  data,
  columns,
  loading,
  error,
  total,
  page,
  pageSize,
  pagination,
  selectable,
  selectedRowIds,
  onSelectionChange,
  sortState,
  onSortChange,
  onPageChange,
  onPageSizeChange,
  rowActions,
  onRowAction,
  bulkActions,
  onBulkAction,
  emptyState,
  getRowId
}: AdminTableProps) {
  const defaultGetRowId = (row: Record<string, any>, index: number) =>
    String(row.id ?? row.key ?? index);

  const resolveRowId = getRowId ?? defaultGetRowId;

  const toggleRowSelection = (rowId: string) => {
    if (selectedRowIds.includes(rowId)) {
      onSelectionChange(selectedRowIds.filter((id) => id !== rowId));
    } else {
      onSelectionChange([...selectedRowIds, rowId]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedRowIds.length === data.length) {
      onSelectionChange([]);
    } else {
      const allIds = data.map((row, index) => resolveRowId(row, index));
      onSelectionChange(allIds);
    }
  };

  const handleSort = (column: TableColumnConfig) => {
    if (!column.sortable) return;
    if (!onSortChange) return;
    const current =
      sortState && sortState.columnId === column.id ? sortState.direction : null;
    const nextDirection = !current ? "asc" : current === "asc" ? "desc" : null;
    onSortChange(
      nextDirection
        ? { columnId: column.id, direction: nextDirection }
        : null
    );
  };

  const renderSortIndicator = (column: TableColumnConfig) => {
    if (!column.sortable) return null;
    if (!sortState || sortState.columnId !== column.id) {
      return <span className="ml-1 text-xs text-muted-foreground">⇅</span>;
    }
    return (
      <span className="ml-1 text-xs text-primary">
        {sortState.direction === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  const selectedRows = selectedRowIds
    .map((rowId) => data.find((row, index) => resolveRowId(row, index) === rowId))
    .filter(Boolean) as Record<string, any>[];

  return (
    <div className="flex flex-col">
      {bulkActions?.length ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          <span>已选择 {selectedRowIds.length} 条</span>
          {bulkActions.map((action) => (
            <Button
              key={action.id}
              size="sm"
              variant={toButtonVariant(action.intent)}
              disabled={action.requiresSelection && selectedRowIds.length === 0}
              onClick={() => onBulkAction?.(action, selectedRows)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      ) : null}
      <div className="relative min-h-[200px]">
        {loading ? (
          <div className="flex h-[200px] items-center justify-center">
            <Spinner />
          </div>
        ) : error ? (
          <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-center">
            <span className="text-base font-medium text-destructive">数据加载失败</span>
            <span className="text-sm text-muted-foreground">{error.message}</span>
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-center">
            <span className="text-base font-medium text-muted-foreground">
              {emptyState?.title ?? "暂无数据"}
            </span>
            {emptyState?.description ? (
              <span className="text-sm text-muted-foreground">
                {emptyState.description}
              </span>
            ) : null}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {selectable ? (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedRowIds.length === data.length && data.length > 0}
                      onChange={() => toggleSelectAll()}
                    />
                  </TableHead>
                ) : null}
                {columns.map((column) => (
                  <TableHead
                    key={column.id}
                    style={{ width: column.width }}
                    className={getAlignmentClass(column.align)}
                    onClick={() => handleSort(column)}
                  >
                    <span className={column.sortable ? "cursor-pointer select-none" : undefined}>
                      {column.label}
                      {renderSortIndicator(column)}
                    </span>
                  </TableHead>
                ))}
                {rowActions?.length ? <TableHead className="w-[140px] text-right">操作</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => {
                const rowId = resolveRowId(row, index);
                return (
                  <TableRow key={rowId} data-state={selectedRowIds.includes(rowId) ? "selected" : undefined}>
                    {selectable ? (
                      <TableCell className="w-12">
                        <Checkbox
                          checked={selectedRowIds.includes(rowId)}
                          onChange={() => toggleRowSelection(rowId)}
                        />
                      </TableCell>
                    ) : null}
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        className={getAlignmentClass(column.align)}
                      >
                        {renderCell(column, row)}
                      </TableCell>
                    ))}
                    {rowActions?.length ? (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {rowActions.map((action) => (
                            <Button
                              key={action.id}
                              size="sm"
                              variant={toButtonVariant(action.intent)}
                              onClick={() => onRowAction?.(action, row)}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
      <PaginationControls
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={pagination?.pageSizeOptions}
      />
    </div>
  );
}
