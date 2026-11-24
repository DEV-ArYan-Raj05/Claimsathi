import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "../lib/cn";

const control =
  "w-full min-h-tap rounded-xl border-2 border-muted/60 bg-secondary px-4 text-base text-ink placeholder:text-ink/50 focus:border-ink focus:outline-none";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={cn(control, className)} {...rest} />;
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={cn(control, "py-3", className)} {...rest} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, ...rest }, ref) {
    return <select ref={ref} className={cn(control, "appearance-auto", className)} {...rest} />;
  },
);

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

/** Label + control + hint/error, wired for screen readers. */
export function Field({ id, label, hint, error, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-base font-medium text-ink">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-sm text-caption">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm font-medium text-ink">
          {error}
        </p>
      )}
    </div>
  );
}

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, hint, id, className, ...rest },
  ref,
) {
  return (
    <label
      htmlFor={id}
      className={cn("flex min-h-tap cursor-pointer items-start gap-3 py-2 text-ink", className)}
    >
      <input
        ref={ref}
        id={id}
        type="checkbox"
        className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-ink)]"
        {...rest}
      />
      <span>
        <span className="block text-base">{label}</span>
        {hint && <span className="block text-sm text-caption">{hint}</span>}
      </span>
    </label>
  );
});
