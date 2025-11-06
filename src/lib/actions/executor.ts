import { resolveActionPayload } from "../data-sources/use-data-source";
import { resolveTemplateValue } from "../utils/template";
import type {
  ActionBaseConfig,
  ActionBehavior,
  ApiBehavior,
  LinkBehavior
} from "../../types/blocks/admin-table";

export interface ActionExecutionContext {
  row?: Record<string, any>;
  rowId?: string;
  rows?: Record<string, any>[];
  rowIds?: string[];
  filters?: Record<string, unknown>;
  formValues?: Record<string, unknown>;
}

export interface ExecuteActionOptions {
  action: ActionBaseConfig;
  context: ActionExecutionContext;
}

function ensureArray(value: Record<string, any> | Record<string, any>[] | undefined) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function buildActionTemplateContext(context: ActionExecutionContext) {
  return {
    ...(context.row ?? {}),
    ...(context.formValues ?? {}),
    row: context.row,
    rowId: context.rowId,
    rows: context.rows,
    rowIds: context.rowIds,
    filters: context.filters,
    form: context.formValues,
    formValues: context.formValues
  };
}

async function handleApiBehavior(
  behavior: ApiBehavior,
  context: ActionExecutionContext
) {
  const templateContext = buildActionTemplateContext(context);

  const endpoint = resolveTemplateValue(behavior.endpoint, templateContext) as string;

  const body = resolveActionPayload(behavior.bodyTemplate, templateContext);

  const response = await fetch(endpoint, {
    method: behavior.method,
    headers: {
      "Content-Type": "application/json",
      ...(behavior.headers ?? {})
    },
    body: behavior.method === "GET" ? undefined : JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(behavior.errorMessage ?? `操作失败: ${response.status} ${text}`);
  }

  if (behavior.successMessage && typeof window !== "undefined") {
    console.info(behavior.successMessage);
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch (error) {
    // ignore when response has no JSON body
  }

  return payload;
}

function handleLinkBehavior(
  behavior: LinkBehavior,
  context: ActionExecutionContext
) {
  if (typeof window === "undefined") return;
  const templateContext = buildActionTemplateContext(context);
  const targetUrl = resolveTemplateValue(behavior.url, templateContext) as string;
  if (behavior.target === "_blank") {
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  } else {
    window.location.href = targetUrl;
  }
}

export async function executeAction({ action, context }: ExecuteActionOptions) {
  if (action.confirm) {
    const message = action.confirm.description
      ? `${action.confirm.title}\n${action.confirm.description}`
      : action.confirm.title;
    if (typeof window !== "undefined" && !window.confirm(message)) {
      return;
    }
  }

  const behavior = action.behavior as ActionBehavior;

  switch (behavior.type) {
    case "api":
      return handleApiBehavior(behavior, context);
    case "link":
      return handleLinkBehavior(behavior, context);
    default:
      return undefined;
  }
}

export function buildBulkActionContext(
  rows: Record<string, any>[]
): ActionExecutionContext {
  const normalizedRows = ensureArray(rows);
  return {
    rows: normalizedRows,
    rowIds: normalizedRows
      .map((row) => (row.id ?? row.key ?? row.uuid ?? null) as string | null)
      .filter((id): id is string => Boolean(id))
  };
}
