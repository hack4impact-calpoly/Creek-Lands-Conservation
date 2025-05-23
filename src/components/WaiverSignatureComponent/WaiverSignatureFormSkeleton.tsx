// src/components/WaiverSignatureComponent/WaiverSignatureFormSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function WaiverSignatureFormSkeleton() {
  return (
    <div className="mx-auto mb-10 flex max-w-[960px] flex-col items-start px-6 py-6">
      {/* Title */}
      <Skeleton className="mb-8 mr-auto h-8 w-64" />

      {/* Waiver Preview Iframe */}
      <Skeleton className="min-h-[600px] w-full rounded border" />

      <div className="my-8 w-full space-y-6">
        {/* Checkbox and Terms */}
        <div className="flex items-start gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-5 w-80" />
        </div>

        {/* Participants Section */}
        <div className="mb-2">
          <Skeleton className="h-5 w-48" />
          <div className="mt-2 flex flex-wrap gap-12">
            {[...Array(3)].map((_, index) => (
              <Skeleton key={index} className="h-4 w-32" />
            ))}
          </div>
        </div>

        {/* Signature Canvas */}
        <div className="flex justify-center">
          <Skeleton className="h-24 w-[400px] border" />
        </div>

        {/* Buttons */}
        <div className="flex justify-center gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  );
}
