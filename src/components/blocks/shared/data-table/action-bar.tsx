import { Button } from "../../../ui/button";
import type { ActionIntent, GlobalActionConfig } from "../../../../types/blocks/admin-table";

interface ActionBarProps {
  actions?: GlobalActionConfig[];
  onTrigger: (action: GlobalActionConfig) => void;
}

function toButtonVariant(intent: ActionIntent | undefined) {
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

export function ActionBar({ actions = [], onTrigger }: ActionBarProps) {
  if (!actions.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card px-6 py-4">
      {actions.map((action) => (
        <Button
          key={action.id}
          variant={toButtonVariant(action.intent)}
          size="sm"
          onClick={() => onTrigger(action)}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}
