import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

/** Default text field on zinc-950 (forms, settings, connection). */
export const formInputClassName =
  "w-full rounded-sm border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100 transition-colors placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none";

interface InputProps extends ComponentProps<"input"> {
  className?: string;
}

export function Input({ className, ...props }: InputProps) {
  return <input className={cn(formInputClassName, className)} {...props} />;
}
