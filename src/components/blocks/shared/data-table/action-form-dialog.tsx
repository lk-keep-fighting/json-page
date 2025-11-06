import type { FormEvent, MouseEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Select } from "../../../ui/select";
import { resolveTemplateValue } from "../../../../lib/utils/template";
import type {
  ActionFormConfig,
  ActionFormFieldConfig,
  NumberFormFieldConfig,
  SelectFormFieldConfig,
  TextFormFieldConfig,
  TextareaFormFieldConfig
} from "../../../../types/blocks/admin-table";

interface ActionFormDialogProps {
  open: boolean;
  form: ActionFormConfig;
  templateContext: Record<string, any>;
  submitting?: boolean;
  errorMessage?: string | null;
  onCancel: () => void;
  onSubmit: (values: Record<string, unknown>) => void;
}

type FieldValueMap = Record<string, string>;
type FieldErrorMap = Record<string, string>;

function getDefaultValue(field: ActionFormFieldConfig, context: Record<string, any>) {
  if (field.defaultValue === undefined) {
    return "";
  }
  const resolved = resolveTemplateValue(field.defaultValue, context);
  if (resolved == null) return "";
  return String(resolved);
}

function isNumberField(field: ActionFormFieldConfig): field is NumberFormFieldConfig {
  return field.type === "number";
}

function isTextField(field: ActionFormFieldConfig): field is TextFormFieldConfig {
  return field.type === "text";
}

function isTextareaField(field: ActionFormFieldConfig): field is TextareaFormFieldConfig {
  return field.type === "textarea";
}

function isSelectField(field: ActionFormFieldConfig): field is SelectFormFieldConfig {
  return field.type === "select";
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
      const defaultValue = getDefaultValue(field, templateContext);
      if (isSelectField(field)) {
        if (defaultValue === "") {
          acc[field.id] = "";
        } else {
          const matchedIndex = field.options.findIndex(
            (option) => String(option.value) === defaultValue
          );
          acc[field.id] = matchedIndex >= 0 ? String(matchedIndex) : "";
        }
      } else {
        acc[field.id] = defaultValue;
      }
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

  const updateValue = (field: ActionFormFieldConfig, next: string) => {
    setValues((prev) => ({
      ...prev,
      [field.id]: next
    }));
  };

  const validate = () => {
    const validationErrors: FieldErrorMap = {};
    form.fields.forEach((field) => {
      const rawValue = values[field.id] ?? "";
      if (field.required) {
        if (rawValue == null || String(rawValue).trim() === "") {
          validationErrors[field.id] = "该字段为必填项";
          return;
        }
      }
      if (isNumberField(field) && rawValue !== "") {
        const numericValue = Number(rawValue);
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
      const rawValue = values[field.id] ?? "";
      if (isNumberField(field)) {
        payload[field.id] = rawValue === "" ? null : Number(rawValue);
        return;
      }
      if (isSelectField(field)) {
        if (rawValue === "") {
          payload[field.id] = null;
          return;
        }
        const optionIndex = Number(rawValue);
        if (Number.isNaN(optionIndex)) {
          payload[field.id] = rawValue;
          return;
        }
        const matched = field.options[optionIndex];
        payload[field.id] = matched ? matched.value : null;
        return;
      }
      payload[field.id] = rawValue;
    });

    onSubmit(payload);
  };

  const renderField = (field: ActionFormFieldConfig) => {
    const value = values[field.id] ?? "";

    if (isTextField(field)) {
      return (
        <Input
          id={field.id}
          value={value}
          onChange={(event) => updateValue(field, event.target.value)}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          disabled={submitting}
        />
      );
    }

    if (isTextareaField(field)) {
      return (
        <textarea
          id={field.id}
          value={value}
          onChange={(event) => updateValue(field, event.target.value)}
          placeholder={field.placeholder}
          rows={field.rows ?? 4}
          maxLength={field.maxLength}
          disabled={submitting}
          className="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      );
    }

    if (isNumberField(field)) {
      return (
        <Input
          id={field.id}
          type="number"
          value={value}
          onChange={(event) => updateValue(field, event.target.value)}
          placeholder={field.placeholder}
          min={field.min}
          max={field.max}
          step={field.step}
          disabled={submitting}
        />
      );
    }

    if (isSelectField(field)) {
      return (
        <Select
          id={field.id}
          value={value}
          onChange={(event) => updateValue(field, event.target.value)}
          disabled={submitting}
        >
          <option value="">
            {field.placeholder ?? "请选择"}
          </option>
          {field.options.map((option, index) => (
            <option key={`${field.id}-${index}`} value={String(index)}>
              {option.label}
            </option>
          ))}
        </Select>
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
