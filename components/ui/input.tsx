import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-keu-black/10 bg-white px-3 py-2 text-sm transition-colors",
          "placeholder:text-keu-black/40",
          "focus:outline-none focus:border-keu-red focus:ring-2 focus:ring-keu-red/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-lg border border-keu-black/10 bg-white px-3 py-2 text-sm transition-colors",
        "placeholder:text-keu-black/40",
        "focus:outline-none focus:border-keu-red focus:ring-2 focus:ring-keu-red/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-lg border border-keu-black/10 bg-white px-3 py-2 text-sm transition-colors",
        "focus:outline-none focus:border-keu-red focus:ring-2 focus:ring-keu-red/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});
Select.displayName = "Select";

export function Label({
  className,
  children,
  required,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className={cn(
        "text-sm font-medium text-keu-black mb-1.5 block",
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-keu-red ml-0.5">*</span>}
    </label>
  );
}
