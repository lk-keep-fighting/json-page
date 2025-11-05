import * as React from "react";
import { cn } from "../../lib/cn";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Spinner({ className, ...props }: SpinnerProps) {
  return (
    <div
      className={cn(
        "h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/40 border-t-primary",
        className
      )}
      {...props}
    />
  );
}
