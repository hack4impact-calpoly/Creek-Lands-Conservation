"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface EventCardProps {
  title: string;
  date: string;
  time: string;
  onMoreInfo?: string;
}

export default function EventCard({ title, date, time, onMoreInfo }: EventCardProps) {
  const handleMoreInfo = () => {
    alert(onMoreInfo || "No additional information available.");
  };
  return (
    <Card className="w-full max-w-sm bg-neutral-200">
      <CardContent className="flex flex-col gap-6 px-6 pb-6 pt-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-medium">{title}</h2>
          <div className="space-y-1">
            <p className="text-xl">{date}</p>
            <p className="text-xl">{time}</p>
          </div>
        </div>
        <Button
          variant="secondary"
          className="h-12 w-full rounded-md bg-neutral-300 text-lg text-black hover:bg-neutral-400"
        >
          More info
        </Button>
      </CardContent>
    </Card>
  );
}
