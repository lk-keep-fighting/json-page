import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent, MouseEvent } from "react";
import { Button } from "../../../ui/button";
import { Checkbox } from "../../../ui/checkbox";
import { Input } from "../../../ui/input";
import { Radio } from "../../../ui/radio";
import { Select } from "../../../ui/select";
import { Textarea } from "../../../ui/textarea";
import { resolveTemplateValue } from "../../../../lib/utils/template";
import type {
  ActionFormConfig,
  ActionFormFieldConfig,
  CheckboxFormFieldConfig,
  DateFormFieldConfig,
  MultiSelectFormFieldConfig,
  NumberFormFieldConfig,
  RadioFormFieldConfig,
  SelectFormFieldConfig,
  TextFormFieldConfig,
  TextareaFormFieldConfig
} from "../../../../types/blocks/admin-table";

type FieldValue = string | string[] | boolean;
type FieldValueUpdater = FieldValue | ((previous: FieldValue | undefined) => FieldValue);
type FieldValueMap = Record<string, FieldValue>;
type FieldErrorMap = Record<string, string>;

function isNumberField(field: ActionFormFieldConfig): field is NumberFormFieldConfig {
  return field.type === "number";
}

function isTextField(field: ActionFormFieldConfig): field is TextFormFieldConfig {
  return field.type === "text" || field.type === "password";
}

function isTextareaField(field: ActionFormFieldConfig): field is TextareaFormFieldConfig {
  return field.type === "textarea";
}

function isSelectField(field: ActionFormFieldConfig): field is SelectFormFieldConfig {
  return field.type === "select";
}

function isRadioField(field: ActionFormFieldConfig): field is RadioFormFieldConfig {
  return field.type === "radio";
}

function isCheckboxField(field: ActionFormFieldConfig): field is CheckboxFormFieldConfig {
  return field.type === "checkbox";
}

function isMultiSelectField(field: ActionFormFieldConfig): field is MultiSelectFormFieldConfig {
  return field.type === "multi-select";
}

function isDateField(field: ActionFormFieldConfig): field is DateFormFieldConfig {
  return field.type === "date" || field.type === "time" || field.type === "datetime";
}

function coerceBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return ["true", "1", "yes", "y", "on"].includes(normalized);
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  return Boolean(value);
}

function getDefaultValue(field: ActionFormFieldConfig, context: Record<string, any>): FieldValue {
  const resolved =
    field.defaultValue === undefined
      ? undefined
      : resolveTemplateValue(field.defaultValue, context);

  if (isSelectField(field) || isRadioField(field)) {
    if (resolved == null || resolved === "") {
      return "";
    }
    const matchedIndex = field.options.findIndex(
      (option) => String(option.value) === String(resolved)
    );
    return matchedIndex >= 0 ? String(matchedIndex) : "";
  }

  if (isMultiSelectField(field)) {
    if (resolved == null) {
      return [];
    }
    const resolvedArray = Array.isArray(resolved) ? resolved : [resolved];
    return resolvedArray
      .map((item) =>
        field.options.findIndex((option) => String(option.value) === String(item))
      )
      .filter((index) => index >= 0)
      .map((index) => String(index));
  }

  if (isCheckboxField(field)) {
    if (resolved === undefined) {
      return false;
    }
    return coerceBoolean(resolved);
  }

  if (resolved == null) {
    return "";
  }

  return String(resolved);
}

interface ActionFormDialogProps {
  open: boolean;
  form: ActionFormConfig;
  templateContext: Record<string, any>;
  submitting?: boolean;
  errorMessage?: string | null;
  onCancel: () => void;
  onSubmit: (values: Record<string, unknown>) => void;
}

export function ActionFormDialog({
  open,
  form,
  templateContext,
  submitting = false,
  errorMessage,
  onCancel,
  onSubmit
}: ActionFormDialogProps) {
  const initialValues = useMemo<FieldValueMap>(() => {
    return form.fields.reduce<FieldValueMap>((acc, field) => {
      acc[field.id] = getDefaultValue(field, templateContext);
      return acc;
    }, {});
  }, [form.fields, templateContext]);

  const [values, setValues] = useState<FieldValueMap>(initialValues);
  const [errors, setErrors] = useState<FieldErrorMap>({});

  useEffect(() => {
    if (open) {
      setValues(initialValues);
      setErrors({});
    }
  }, [open, initialValues]);

  if (!open) {
    return null;
  }

  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !submitting) {
      onCancel();
    }
  };

  const updateValue = (field: ActionFormFieldConfig, next: FieldValueUpdater) => {
    setValues((prev) => {
      const previousValue = prev[field.id];
      const nextValue =
        typeof next === "function"
          ? (next as (previous: FieldValue | undefined) => FieldValue)(previousValue)
          : next;
      if (previousValue === nextValue) {
        return prev;
      }
      return {
        ...prev,
        [field.id]: nextValue
      };
    });
    setErrors((prev) => {
      if (!prev[field.id]) {
        return prev;
      }
      const { [field.id]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const validate = () => {
    const validationErrors: FieldErrorMap = {};
    form.fields.forEach((field) => {
      const rawValue = values[field.id];

      if (isMultiSelectField(field)) {
        const selections = Array.isArray(rawValue) ? rawValue : [];
        if (field.required && selections.length === 0) {
          validationErrors[field.id] = "请至少选择一项";
          return;
        }
        if (field.maxSelections && selections.length > field.maxSelections) {
          validationErrors[field.id] = `最多可选择 ${field.maxSelections} 项`;
        }
        return;
      }

      if (isCheckboxField(field)) {
        const boolValue = Boolean(rawValue);
        if (field.required && !boolValue) {
          validationErrors[field.id] = "请勾选该选项";
        }
        return;
      }

      const stringValue =
        typeof rawValue === "string"
          ? rawValue
          : rawValue == null
            ? ""
            : String(rawValue);

      if (field.required && stringValue.trim() === "") {
        validationErrors[field.id] = "该字段为必填项";
        return;
      }

      if (isNumberField(field) && stringValue !== "") {
        const numericValue = Number(stringValue);
        if (Number.isNaN(numericValue)) {
          validationErrors[field.id] = "请输入有效的数字";
          return;
        }
        if (field.min != null && numericValue < field.min) {
          validationErrors[field.id] = `数值不能小于 ${field.min}`;
          return;
        }
        if (field.max != null && numericValue > field.max) {
          validationErrors[field.id] = `数值不能大于 ${field.max}`;
          return;
        }
      }

      if (isDateField(field) && stringValue !== "") {
        if (field.min && stringValue < field.min) {
          validationErrors[field.id] = `请选择不早于 ${field.min} 的时间`;
          return;
        }
        if (field.max && stringValue > field.max) {
          validationErrors[field.id] = `请选择不晚于 ${field.max} 的时间`;
        }
      }
    });
    setErrors(validationErrors);
    return validationErrors;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      return;
    }

    const payload: Record<string, unknown> = {};

    form.fields.forEach((field) => {
      const rawValue = values[field.id];

      if (isNumberField(field)) {
        const stringValue = typeof rawValue === "string" ? rawValue : String(rawValue ?? "");
        payload[field.id] = stringValue === "" ? null : Number(stringValue);
        return;
      }

      if (isSelectField(field) || isRadioField(field)) {
        const stringValue = typeof rawValue === "string" ? rawValue : "";
        if (stringValue === "") {
          payload[field.id] = null;
          return;
        }
        const optionIndex = Number(stringValue);
        if (Number.isNaN(optionIndex)) {
          payload[field.id] = stringValue;
          return;
        }
        const matched = field.options[optionIndex];
        payload[field.id] = matched ? matched.value : null;
        return;
      }

      if (isMultiSelectField(field)) {
        const selections = Array.isArray(rawValue) ? rawValue : [];
        const resolvedValues = selections
          .map((indexString) => {
            const option = field.options[Number(indexString)];
            return option ? option.value : undefined;
          })
          .filter((value) => value !== undefined);
        payload[field.id] = resolvedValues;
        return;
      }

      if (isCheckboxField(field)) {
        payload[field.id] = Boolean(rawValue);
        return;
      }

      const stringValue = typeof rawValue === "string" ? rawValue : String(rawValue ?? "");
      payload[field.id] = stringValue;
    });

    onSubmit(payload);
  };

  const handleCheckboxChange = (field: CheckboxFormFieldConfig) => (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    updateValue(field, event.target.checked);
  };

  const handleMultiSelectChange = (
    field: MultiSelectFormFieldConfig,
    optionIndex: string
  ) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const { checked } = event.target;
      updateValue(field, (previous) => {
        const current = Array.isArray(previous) ? previous : [];
        if (checked) {
          return current.includes(optionIndex) ? current : [...current, optionIndex];
        }
        return current.filter((item) => item !== optionIndex);
      });
    };

  const renderField = (field: ActionFormFieldConfig) => {
    const value = values[field.id];

    if (isTextField(field)) {
      const stringValue = typeof value === "string" ? value : "";
      const inputType = field.type === "password" ? "password" : "text";
      return (
        <Input
          id={field.id}
          type={inputType}
          value={stringValue}
          onChange={(event) => updateValue(field, event.target.value)}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          disabled={submitting}
        />
      );
    }

    if (isTextareaField(field)) {
      const stringValue = typeof value === "string" ? value : "";
      return (
        <Textarea
          id={field.id}
          value={stringValue}
          onChange={(event) => updateValue(field, event.target.value)}
          placeholder={field.placeholder}
          rows={field.rows}
          maxLength={field.maxLength}
          disabled={submitting}
        />
      );
    }

    if (isNumberField(field)) {
      const stringValue = typeof value === "string" ? value : "";
      return (
        <Input
          id={field.id}
          type="number"
          value={stringValue}
          onChange={(event) => updateValue(field, event.target.value)}
          placeholder={field.placeholder}
          min={field.min}
          max={field.max}
          step={field.step}
          disabled={submitting}
        />
      );
    }

    if (isDateField(field)) {
      const stringValue = typeof value === "string" ? value : "";
      const inputType = field.type === "datetime" ? "datetime-local" : field.type;
      return (
        <Input
          id={field.id}
          type={inputType}
          value={stringValue}
          onChange={(event) => updateValue(field, event.target.value)}
          placeholder={field.placeholder}
          min={field.min}
          max={field.max}
          disabled={submitting}
        />
      );
    }

    if (isSelectField(field)) {
      const stringValue = typeof value === "string" ? value : "";
      return (
        <Select
          id={field.id}
          value={stringValue}
          onChange={(event) => updateValue(field, event.target.value)}
          disabled={submitting}
        >
          <option value="">{field.placeholder ?? "请选择"}</option>
          {field.options.map((option, index) => (
            <option key={`${field.id}-${index}`} value={String(index)}>
              {option.label}
            </option>
          ))}
        </Select>
      );
    }

    if (isRadioField(field)) {
      const stringValue = typeof value === "string" ? value : "";
      return (
        <div className="flex flex-col gap-2">
          {field.options.map((option, index) => {
            const optionIndex = String(index);
            const optionId = `${field.id}-${index}`;
            return (
              <label key={optionId} htmlFor={optionId} className="flex items-center gap-2 text-sm">
                <Radio
                  id={optionId}
                  name={field.id}
                  value={optionIndex}
                  checked={stringValue === optionIndex}
                  onChange={(event) => updateValue(field, event.target.value)}
                  disabled={submitting}
                />
                <span className="text-foreground">{option.label}</span>
              </label>
            );
          })}
        </div>
      );
    }

    if (isMultiSelectField(field)) {
      const selections = Array.isArray(value) ? value : [];
      return (
        <div className="flex flex-col gap-2">
          {field.options.map((option, index) => {
            const optionIndex = String(index);
            const optionId = `${field.id}-${index}`;
            return (
              <label key={optionId} htmlFor={optionId} className="flex items-center gap-2 text-sm">
                <Checkbox
                  id={optionId}
                  checked={selections.includes(optionIndex)}
                  onChange={handleMultiSelectChange(field, optionIndex)}
                  disabled={submitting}
                />
                <span className="text-foreground">{option.label}</span>
              </label>
            );
          })}
          {field.maxSelections ? (
            <p className="text-xs text-muted-foreground">最多可选择 {field.maxSelections} 项</p>
          ) : null}
        </div>
      );
    }

    if (isCheckboxField(field)) {
      const checked = Boolean(value);
      const stateLabel = checked
        ? field.trueLabel ?? "已启用"
        : field.falseLabel ?? "已关闭";
      return (
        <div className="flex items-center gap-3">
          <Checkbox
            id={field.id}
            checked={checked}
            onChange={handleCheckboxChange(field)}
            disabled={submitting}
          />
          <span className="text-sm text-muted-foreground">{stateLabel}</span>
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={handleOverlayClick}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-lg bg-background shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            {form.title ?? "填写表单"}
          </h2>
          {form.description ? (
            <p className="mt-1 text-sm text-muted-foreground">{form.description}</p>
          ) : null}
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-6">
          {form.fields.map((field) => (
            <div key={field.id} className="flex flex-col gap-2">
              <label htmlFor={field.id} className="text-sm font-medium text-foreground">
                <span>{field.label}</span>
                {field.required ? <span className="ml-1 text-destructive">*</span> : null}
              </label>
              {renderField(field)}
              {field.description ? (
                <p className="text-xs text-muted-foreground">{field.description}</p>
              ) : null}
              {errors[field.id] ? (
                <p className="text-xs text-destructive">{errors[field.id]}</p>
              ) : null}
            </div>
          ))}
          {errorMessage ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
              {form.cancelLabel ?? "取消"}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "提交中..." : form.submitLabel ?? "提交"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
