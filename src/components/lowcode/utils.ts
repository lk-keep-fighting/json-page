export function getValueByPath<T extends Record<string, any>>(obj: T, path: string) {
  if (!path) return undefined;
  return path.split(".").reduce((acc: any, key) => (acc == null ? undefined : acc[key]), obj);
}

const PLACEHOLDER_REGEX = /{{\s*([\w.]+)\s*}}/g;
const SINGLE_PLACEHOLDER_REGEX = /^{{\s*([\w.]+)\s*}}$/;

export function resolveTemplateValue(value: unknown, context: Record<string, any>) {
  if (typeof value === "string") {
    const singleMatch = value.match(SINGLE_PLACEHOLDER_REGEX);
    if (singleMatch) {
      const resolved = getValueByPath(context, singleMatch[1].trim());
      return resolved ?? "";
    }
    return value.replace(PLACEHOLDER_REGEX, (_, key) => {
      const resolved = getValueByPath(context, key.trim());
      return resolved != null ? String(resolved) : "";
    });
  }
  if (Array.isArray(value)) {
    return value.map((item) => resolveTemplateValue(item, context));
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).reduce(
      (acc, [k, v]) => {
        acc[k] = resolveTemplateValue(v, context);
        return acc;
      },
      {} as Record<string, unknown>
    );
  }
  return value;
}

export function resolveQueryParams(
  template: Record<string, string> | undefined,
  context: Record<string, any>
) {
  if (!template) return undefined;
  return Object.entries(template).reduce<Record<string, string>>((acc, [key, value]) => {
    const resolved = resolveTemplateValue(value, context);
    if (resolved != null) {
      acc[key] = String(resolved);
    }
    return acc;
  }, {});
}
