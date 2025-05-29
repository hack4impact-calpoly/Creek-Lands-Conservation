import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FieldError, FieldPath, FieldValues, Path, RegisterOptions, UseFormRegister } from "react-hook-form";

type DateTimeFieldProps<
  TFieldValues extends FieldValues, // represents the form
  TDateFieldName extends FieldPath<TFieldValues>,
  TTimeFieldName extends FieldPath<TFieldValues>, // represents the field we are filling
> = {
  dateName: TDateFieldName;
  timeName: TTimeFieldName;
  label: string;
  errors: { date?: FieldError; time?: FieldError };
  register: UseFormRegister<TFieldValues>;
  dateRules?: RegisterOptions<TFieldValues, TDateFieldName>;
  timeRules?: RegisterOptions<TFieldValues, TTimeFieldName>;
  disabled?: boolean;
  className?: string;
};

/* If more flexibility is needed, using regular InputField components will have a better result */
export const DateTimeField = <T extends FieldValues, U extends FieldPath<T>, V extends FieldPath<T>>({
  dateName,
  timeName,
  label,
  errors,
  register,
  dateRules,
  timeRules,
  disabled,
  className,
}: DateTimeFieldProps<T, U, V>) => (
  <div className={cn("space-y-1", className)}>
    <label className="text-sm sm:text-base">{label}</label>
    <div className="flex flex-row gap-2">
      <Input
        id={dateName}
        type="date"
        className="flex-1 text-sm sm:text-base"
        {...register(dateName, dateRules)}
        disabled={disabled}
      />
      <Input
        id={timeName}
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
