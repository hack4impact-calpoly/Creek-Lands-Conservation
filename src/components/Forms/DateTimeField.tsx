// components/DateTimeField.tsx
import { Input } from "@/components/ui/input";
import { FieldError } from "react-hook-form";

type DateTimeFieldProps = {
  dateName: string;
  timeName: string;
  label: string;
  errors: { date?: FieldError; time?: FieldError };
  register: any;
  disabled?: boolean;
};

export const DateTimeField = ({ dateName, timeName, label, errors, register, disabled }: DateTimeFieldProps) => (
  <div className="space-y-1">
    <label className="text-sm sm:text-base">{label}</label>
    <div className="flex flex-row gap-2">
      <Input type="date" className="flex-1 text-sm sm:text-base" {...register(dateName)} disabled={disabled} />
      <Input type="time" className="flex-1 text-sm sm:text-base" {...register(timeName)} disabled={disabled} />
    </div>
    {errors.date && <p className="text-xs text-red-500 sm:text-sm">{errors.date.message}</p>}
    {errors.time && <p className="text-xs text-red-500 sm:text-sm">{errors.time.message}</p>}
  </div>
);
