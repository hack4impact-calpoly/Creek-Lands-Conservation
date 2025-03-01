import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Control,
  Controller,
  ControllerProps,
  FieldError,
  FieldPath,
  FieldValues,
  Path,
  RegisterOptions,
  UseControllerProps,
  UseFormReturn,
} from "react-hook-form";

type SelectFieldProps<
  TFieldValues extends FieldValues, // represents the form
  TFieldName extends FieldPath<TFieldValues>, // represents the field we are filling
> = {
  label: string;
  name: TFieldName;
  options: { value: string; label: string }[];
  control: Control<TFieldValues>;
  rules?: RegisterOptions<TFieldValues, TFieldName>;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
};

export const SelectField = <T extends FieldValues, U extends FieldPath<T>>({
  label,
  name,
  options,
  control,
  rules,
  className,
  disabled,
  placeholder = "Select...",
}: SelectFieldProps<T, U>) => (
  <div className={cn("space-y-1", className)}>
    <label className="text-sm sm:text-base" htmlFor={name}>
      {label}
    </label>
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <>
          <Select {...field} onValueChange={field.onChange} value={field.value} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldState.error && <p className="text-xs text-red-500 sm:text-sm">{fieldState.error.message}</p>}
        </>
      )}
    />
  </div>
);
