// components/FormField.tsx
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "react-hook-form";
import { cn } from "@/lib/utils"; // Assuming you have a cn utility (or use classnames)

type FormFieldProps = {
  type?: "text" | "number" | "textarea";
  label: string;
  error?: FieldError;
  register: any;
  name: string;
  disabled?: boolean;
  step?: string;
  min?: number;
  className?: string;
  inputClassName?: string;
};

export const FormField = ({
  type = "text",
  label,
  error,
  register,
  name,
  disabled,
  step,
  min,
  className,
  inputClassName,
}: FormFieldProps) => (
  <div className={cn("space-y-1", className)}>
    <label className="text-sm sm:text-base" htmlFor={name}>
      {label}
    </label>
    {type === "textarea" ? (
      <Textarea {...register(name)} disabled={disabled} className={inputClassName} />
    ) : (
      <Input type={type} step={step} min={min} {...register(name)} disabled={disabled} className={inputClassName} />
    )}
    {error && <p className="text-xs text-red-500 sm:text-sm">{error.message}</p>}
  </div>
);
