import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

/**
 * `primary` is the accent fill — allowed once per screen, on its single main action (PRD §2).
 * `solid` is the everyday filled button in ink; `quiet` is text-only.
 */
export type ButtonVariant = "primary" | "solid" | "outline" | "quiet" | "onDominant";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent/90",
  solid: "bg-ink text-secondary hover:bg-ink/90",
  outline: "border-2 border-ink/25 text-ink hover:border-ink/50 bg-transparent",
  quiet: "text-ink underline-offset-4 hover:underline bg-transparent",
  onDominant:
    "border-2 border-on-dominant/40 text-on-dominant hover:border-on-dominant/80 bg-transparent",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isBusy?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "solid", isBusy = false, className, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isBusy}
      aria-busy={isBusy || undefined}
      className={cn(
        "inline-flex min-h-tap items-center justify-center gap-2 rounded-xl px-5 text-base font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
