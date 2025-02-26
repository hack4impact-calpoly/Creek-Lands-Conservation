// components/FormActions.tsx
import { Button } from "@/components/ui/button";

type FormActionsProps = { onCancel: () => void; isSubmitting: boolean };

export const FormActions = ({ onCancel, isSubmitting }: FormActionsProps) => (
  <div className="flex flex-col items-center justify-between gap-3 sm:flex-row sm:gap-4">
    <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onCancel}>
      Cancel
    </Button>
    <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
      {isSubmitting ? "Saving..." : "Save Changes"}
    </Button>
  </div>
);
