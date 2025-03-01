// components/DateTimeField.tsx
import { Input } from "@/components/ui/input";
import { FieldError, Path, RegisterOptions, UseFormRegister } from "react-hook-form";

type DateTimeFieldProps<T extends Record<string, any>> = {
  dateName: Path<T>;
  timeName: Path<T>;
  label: string;
  errors: { date?: FieldError; time?: FieldError };
  register: UseFormRegister<T>;
  dateRules?: RegisterOptions<T, Path<T>>;
  timeRules?: RegisterOptions<T, Path<T>>;
  disabled?: boolean;
  className?: string;
};

export const DateTimeField = <T extends Record<string, any>>({
  dateName,
  timeName,
  label,
  errors,
  register,
  dateRules,
  timeRules,
  disabled,
  className,
}: DateTimeFieldProps<T>) => (
  <div className={cn("space-y-1", className)}>
    <label className="text-sm sm:text-base">{label}</label>
    <div className="flex flex-row gap-2">
      <Input
        type="date"
        className="flex-1 text-sm sm:text-base"
        {...register(dateName, dateRules)}
        disabled={disabled}
      />
      <Input
        type="time"
        className="flex-1 text-sm sm:text-base"
        {...register(timeName, timeRules)}
        disabled={disabled}
      />
    </div>
    {errors.date && <p className="text-xs text-red-500 sm:text-sm">{errors.date.message}</p>}
    {errors.time && <p className="text-xs text-red-500 sm:text-sm">{errors.time.message}</p>}
  </div>
);
