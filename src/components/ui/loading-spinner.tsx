import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  return (
    <div className="flex h-screen items-center justify-center">
      <div
        className={cn(
          "relative inline-flex rounded-full border-2 border-t-primary border-r-primary/30 border-b-primary/10 border-l-primary/30",
          "animate-spin duration-1000",
          size === "sm" && "h-4 w-4",
          size === "md" && "h-8 w-8",
          size === "lg" && "h-16 w-16",
          className,
        )}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading</span>
      </div>
    </div>
  );
}
