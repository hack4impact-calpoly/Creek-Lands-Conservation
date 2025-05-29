"use client";

import type React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CalendarRange, CircleCheck, Clock, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface WaiverSignatureProps {
  eventName: string;
  startDateTime: Date;
  endDateTime: Date;
  signed: boolean;
  signatureDate?: Date;
  signByDate?: Date;
  onViewWaiver: () => void;
  onSignWaiver?: () => void;
  childName?: string; // Optional prop for children's waivers
}

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);

const formatTime = (date: Date) =>
  new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "numeric", hour12: true }).format(date);

const formatDateTime = (date: Date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(date);

const WaiverSignatureComponent: React.FC<WaiverSignatureProps> = ({
  eventName,
  startDateTime,
  endDateTime,
  signed,
  signatureDate,
  signByDate,
  onViewWaiver,
  onSignWaiver,
  childName, // Destructure childName
}) => {
  // Format dates for display
  const startDate = formatDate(startDateTime);
  const startTime = formatTime(startDateTime);
  const endDate = formatDate(endDateTime);
  const endTime = formatTime(endDateTime);

  // Check if event spans multiple days
  const isMultiDay = startDate !== endDate;

  // Format signature date
  const signatureDateString = signatureDate && formatDate(signatureDate);
  const signatureTimeString = signatureDate && formatTime(signatureDate);

  // Format sign by date
  const signByDateString = signByDate && formatDate(signByDate);

  return (
    <Card
      className={cn(
        "flex w-full flex-col gap-3 rounded-lg p-4 shadow-sm transition-all duration-200 hover:shadow-md sm:flex-row sm:items-center sm:justify-between",
        signed ? "bg-gray-50 hover:bg-gray-100" : "bg-amber-50 hover:bg-amber-100",
      )}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-base font-semibold sm:text-lg">
            {eventName}
            {childName && <span className="text-sm font-normal text-muted-foreground"> (for {childName})</span>}
          </h3>
          {signed && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
              <CircleCheck className="h-3 w-3" /> Signed
            </span>
          )}
          {!signed && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              <AlertTriangle className="h-3 w-3" /> Needs Signature
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-3">
          <div className="flex items-center gap-1">
            <CalendarRange className="h-3.5 w-3.5" />
            {isMultiDay ? (
              <span>
                {startDate} - {endDate}
              </span>
            ) : (
              <span>{startDate}</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {isMultiDay ? (
              <span>
                {startTime} - {endTime}
              </span>
            ) : (
              <span>
                {startTime} - {endTime}
              </span>
            )}
          </div>

          {signed && signatureDate && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <CircleCheck className="h-3.5 w-3.5" />
                    <span>Signed {signatureDateString}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Signed on {formatDateTime(signatureDate)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {!signed && signByDate && (
            <div className="flex items-center gap-1 text-xs font-medium text-amber-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Sign by {signByDateString}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 sm:mt-0">
        <Button
          onClick={signed ? onViewWaiver : onSignWaiver}
          variant={signed ? "outline" : "default"}
          className={cn(
            "gap-2 text-sm",
            signed
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
              : "",
          )}
        >
          {signed ? (
            <>
              <Eye className="h-4 w-4" /> View Waiver
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4" /> Sign Waiver
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};

export default WaiverSignatureComponent;
