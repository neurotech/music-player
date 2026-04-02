import { cva, type VariantProps } from "class-variance-authority";
import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from "react";

import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center cursor-pointer select-none transition-colors disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "rounded-sm border border-zinc-900 bg-indigo-600 bg-linear-to-b from-indigo-400/60 to-indigo-800 font-semibold text-white shadow-[0_1px_rgba(255,255,255,0.2)_inset,0_1px_1px_rgba(0,0,0,0.1)] hover:from-indigo-400/90 hover:to-indigo-800/80 disabled:bg-zinc-900/70 disabled:from-zinc-800/50 disabled:to-zinc-800 disabled:text-zinc-500 text-shadow-xs",
        secondary:
          "rounded-sm border border-zinc-800 bg-zinc-800 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-700",
        danger: "rounded-sm bg-red-600 text-white hover:bg-red-500",
        ghost: "rounded-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300",
        link: "text-zinc-500 hover:text-zinc-200",
      },
      size: {
        sm: "gap-1 px-2 py-1 text-sm",
        md: "gap-1.5 px-3 py-1.5 text-sm",
        lg: "gap-2 px-4 py-2 text-sm",
        icon: "p-1.5",
        "icon-sm": "p-1",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children?: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, children, type = "button", ...props }, ref) => {
    return (
      <button
        type={type}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export type { ButtonProps };
export { Button, buttonVariants };
