// components/FormField.tsx
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "react-hook-form";

type FormFieldProps = {
  type?: "text" | "number" | "textarea";
  label: string;
  error?: FieldError;
  register: any;
  name: string;
  disabled?: boolean;
  step?: string;
  min?: number;
};

export const FormField = ({ type = "text", label, error, register, name, disabled, step, min }: FormFieldProps) => (
  <div className="space-y-1">
    <label className="text-sm sm:text-base">{label}</label>
    {type === "textarea" ? (
      <Textarea {...register(name)} disabled={disabled} />
    ) : (
      <Input type={type} step={step} min={min} {...register(name)} disabled={disabled} />
    )}
    {error && <p className="text-xs text-red-500 sm:text-sm">{error.message}</p>}
  </div>
);
