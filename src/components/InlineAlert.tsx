import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type InlineAlertVariant = "error" | "success";

const variantClass: Record<InlineAlertVariant, string> = {
  error: "border-red-900/50 bg-red-950/50 text-red-400",
  success: "border-green-900/50 bg-green-950/50 text-green-400",
};

interface InlineAlertProps {
  variant: InlineAlertVariant;
  children: ReactNode;
  className?: string;
}

export function InlineAlert({ variant, children, className }: InlineAlertProps) {
  return (
    <p
      className={cn(
        "rounded-sm border px-2 py-1.5 text-sm",
        variantClass[variant],
        className,
      )}
    >
      {children}
    </p>
  );
}
