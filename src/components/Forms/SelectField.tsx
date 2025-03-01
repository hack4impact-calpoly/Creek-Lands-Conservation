import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Controller, FieldError, Path, RegisterOptions, UseFormReturn } from "react-hook-form";

type SelectFieldProps<T extends Record<string, any>> = {
  label: string;
  name: Path<T>;
  options: { value: string; label: string }[];
  control: UseFormReturn<T>["control"];
  rules?: RegisterOptions<T, Path<T>>;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
};

export const SelectField = <T extends Record<string, any>>({
  label,
  name,
  options,
  control,
  rules,
  className,
  disabled,
  placeholder = "Select...",
}: SelectFieldProps<T>) => (
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
