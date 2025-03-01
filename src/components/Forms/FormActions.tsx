// components/FormActions.tsx
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FormActionsProps = {
  onSecondary: () => void;
  isSubmitting: boolean;
  secondaryLabel?: string;
  submitLabel?: string;
  isSubmittingLabel?: string;
  className?: string;
};

export const FormActions = ({
  onSecondary,
  isSubmitting,
  secondaryLabel = "Cancel",
  submitLabel = "Submit",
  isSubmittingLabel = "saving...",
  className,
}: FormActionsProps) => (
  <div className={cn("flex flex-col items-center justify-between gap-3 sm:flex-row sm:gap-4", className)}>
    <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onSecondary} disabled={isSubmitting}>
      {secondaryLabel}
    </Button>
    <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
      {isSubmitting ? isSubmittingLabel : submitLabel}
    </Button>
  </div>
);
