import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FieldError,
  FieldPath,
  FieldValue,
  FieldValues,
  Path,
  RegisterOptions,
  UseFormRegister,
} from "react-hook-form";
import { cn } from "@/lib/utils";

type FormFieldProps<
  TFieldValues extends FieldValues, // represents the form
  TFieldName extends FieldPath<TFieldValues>, // represents the field we are filling
> = {
  type?: "text" | "number" | "textarea" | "email" | "tel" | "date" | "time";
  label: string;
  placeholder?: string;
  error?: FieldError;
  register: UseFormRegister<TFieldValues>;
  name: TFieldName;
  rules?: RegisterOptions<TFieldValues, TFieldName>;
  disabled?: boolean;
  step?: string;
  min?: number;
  className?: string;
  inputClassName?: string;
};

export const FormField = <T extends FieldValues, U extends FieldPath<T>>({
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
}: FormFieldProps<T, U>) => (
  <div className={cn("space-y-1", className)}>
    <label className="text-sm sm:text-base" htmlFor={name}>
      {label}
    </label>
    {type === "textarea" ? (
      <Textarea
        id={name}
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
        id={name}
        {...register(name, rules)}
        disabled={disabled}
        className={inputClassName}
        placeholder={placeholder}
      />
    )}
    {error && <p className="text-xs text-red-500 sm:text-sm">{error.message}</p>}
  </div>
);
