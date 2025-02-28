import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { FieldError } from "react-hook-form";

interface SelectFieldProps {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  register: any;
  error?: FieldError;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

export const SelectField = ({
  label,
  name,
  options,
  register,
  error,
  className,
  disabled,
  placeholder = "Select...",
}: SelectFieldProps) => (
  <div className={cn("space-y-1", className)}>
    <label className="text-sm sm:text-base" htmlFor={name}>
      {label}
    </label>
    <Select {...register(name)} disabled={disabled}>
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
