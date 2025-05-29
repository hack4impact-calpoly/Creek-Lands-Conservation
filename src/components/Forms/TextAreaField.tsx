import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldError, FieldPath, FieldValues, RegisterOptions, UseFormRegister } from "react-hook-form";
import { cn } from "@/lib/utils";
import { ComponentPropsWithoutRef } from "react";

type TextAreaFieldProps<
  TFieldValues extends FieldValues, // represents the form
  TFieldName extends FieldPath<TFieldValues>, // represents the field we are filling
> = ComponentPropsWithoutRef<"textarea"> & {
  // get all input props
  name: TFieldName;
  label: string;
  register: UseFormRegister<TFieldValues>;
  rules?: RegisterOptions<TFieldValues, TFieldName>;
  error?: FieldError;
  className?: string;
  inputClassName?: string;
};

export const TextAreaField = <T extends FieldValues, U extends FieldPath<T>>({
  name,
  label,
  register,
  rules,
  error,
  className,
  inputClassName,
  ...rest
}: TextAreaFieldProps<T, U>) => (
  <div className={cn("space-y-1", className)}>
    <label className="text-sm sm:text-base" htmlFor={name}>
      {label}
    </label>
    <Textarea id={name} className={inputClassName} {...register(name, rules)} {...rest} />
    {error && <p className="text-xs text-red-500 sm:text-sm">{error.message}</p>}
  </div>
);
