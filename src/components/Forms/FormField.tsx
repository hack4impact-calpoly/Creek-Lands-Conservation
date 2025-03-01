// components/FormField.tsx
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldError, Path, RegisterOptions, UseFormRegister } from "react-hook-form";
import { cn } from "@/lib/utils"; // Assuming you have a cn utility (or use classnames)

type FormFieldProps<T extends Record<string, any>> = {
  type?: "text" | "number" | "textarea" | "email" | "tel" | "date";
  label: string;
  placeholder?: string;
  error?: FieldError;
  register: UseFormRegister<T>;
  name: Path<T>;
  rules?: RegisterOptions<T, Path<T>>;
  disabled?: boolean;
  step?: string;
  min?: number;
  className?: string;
  inputClassName?: string;
};

export const FormField = <T extends Record<string, any>>({
  type = "text",
  label,
  placeholder,
  error,
  register,
  name,
  rules,
  disabled,
  step,
  min,
  className,
  inputClassName,
}: FormFieldProps<T>) => (
  <div className={cn("space-y-1", className)}>
    <label className="text-sm sm:text-base" htmlFor={name}>
      {label}
    </label>
    {type === "textarea" ? (
      <Textarea
        {...register(name, rules)} // this is prettier (pun intended)
        disabled={disabled}
        className={inputClassName}
        placeholder={placeholder}
      />
    ) : (
      <Input
        type={type}
        step={step}
        min={min}
        {...register(name, rules)}
        disabled={disabled}
        className={inputClassName}
        placeholder={placeholder}
      />
    )}
    {error && <p className="text-xs text-red-500 sm:text-sm">{error.message}</p>}
  </div>
);
