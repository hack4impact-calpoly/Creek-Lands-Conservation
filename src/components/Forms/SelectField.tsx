import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { FieldError, Path, RegisterOptions, UseFormRegister } from "react-hook-form";

type SelectFieldProps<T extends Record<string, any>> = {
  label: string;
  name: Path<T>;
  options: { value: string; label: string }[];
  register: UseFormRegister<T>;
  rules?: RegisterOptions<T, Path<T>>;
  error?: FieldError;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
};

export const SelectField = <T extends Record<string, any>>({
  label,
  name,
  options,
  register,
  rules,
  error,
  className,
  disabled,
  placeholder = "Select...",
}: SelectFieldProps<T>) => (
  <div className={cn("space-y-1", className)}>
    <label className="text-sm sm:text-base" htmlFor={name}>
      {label}
    </label>
    <Select {...register(name, rules)} disabled={disabled}>
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
    {error && <p className="text-xs text-red-500 sm:text-sm">{error.message}</p>}
  </div>
);
