import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

const WaiverSignatureSkeleton = () => {
  return (
    <Card className="flex w-full items-center justify-between gap-3 rounded-lg bg-gray-50 p-2 shadow-md">
      <div className="flex flex-wrap items-center gap-2 md:gap-4 xl:gap-10">
        <Skeleton className="h-5 w-24 sm:h-6 sm:w-32" />
        <Skeleton className="h-6 w-32 sm:h-7 sm:w-40 lg:h-8 lg:w-60" />
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <Skeleton className="h-12 w-32 rounded-lg sm:h-14 sm:w-40 lg:h-16 lg:w-48" />
        <Skeleton className="hidden h-16 w-56 rounded-lg lg:block" />
      </div>
    </Card>
  );
};

export default WaiverSignatureSkeleton;
