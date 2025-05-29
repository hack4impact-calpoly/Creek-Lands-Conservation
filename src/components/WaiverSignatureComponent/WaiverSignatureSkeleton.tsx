import type React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const WaiverSignatureSkeleton: React.FC = () => {
  return (
    <Card className="flex w-full flex-col gap-3 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex w-full flex-col gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>

        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 sm:mt-0">
        <Skeleton className="h-9 w-28" />
      </div>
    </Card>
  );
};

export default WaiverSignatureSkeleton;
