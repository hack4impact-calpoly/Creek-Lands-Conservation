import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CircleCheck } from "lucide-react";

interface WaiverSignatureProps {
  eventName: string;
  startDateTime: Date;
  endDateTime: Date;
  signed: boolean;
  signatureDate?: Date;
  signByDate?: Date;
  onViewWaiver: () => void;
  onSignWaiver?: () => void;
}

const getDateString = (date: Date) =>
  new Intl.DateTimeFormat("en-US", { month: "numeric", day: "numeric", year: "2-digit" }).format(date);

const formatDateTime = (date: Date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
    hour: "numeric",
    minute: "numeric",
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
}) => {
  const startString = formatDateTime(startDateTime);
  const endString = formatDateTime(endDateTime);

  const rangeString = `${startString} - ${endString}`;

  const signatureDateString = signatureDate && getDateString(signatureDate);
  const signByDateString = signByDate && getDateString(signByDate);

  return (
    <Card className="flex w-full items-center justify-between gap-3 rounded-lg bg-gray-50 p-4 shadow-md">
      <div className="flex flex-wrap items-center gap-2 md:gap-4 xl:gap-10">
        <div className="truncate text-sm font-semibold sm:text-base lg:text-lg">{eventName}</div>
        <div className="flex flex-row items-center gap-1 text-sm text-gray-900 sm:text-base">{rangeString}</div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-2 sm:gap-4">
        <Button
          onClick={signed ? onViewWaiver : onSignWaiver}
          variant="default"
          className={`gap-1 rounded-lg px-2 py-3 text-sm font-semibold sm:px-3 sm:py-4 sm:text-base lg:px-4 lg:py-6 lg:text-lg ${
            signed
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 "
              : "bg-amber-100 text-amber-700 hover:bg-amber-200"
          }`}
        >
          {signed ? (
            <>
              <CircleCheck className="mr-3 h-7 w-7 scale-150" /> Signed
              <span>{signatureDateString}</span>
            </>
          ) : (
            <>
              <AlertTriangle className="mr-3 h-7 w-7 scale-150" /> Needs Signature
              {signByDateString && <span className="hidden md:inline">by {signByDateString}</span>}
              <span className="inline md:hidden">→</span>
            </>
          )}
        </Button>

        {/* View Waiver Button (Only visible on lg+ screens) */}
        <Button
          className="hidden rounded-lg bg-gray-200 px-4 py-6 text-base text-gray-700 transition hover:bg-gray-300 lg:flex lg:text-lg"
          onClick={signed ? onViewWaiver : onSignWaiver}
        >
          {signed ? "Click here to View Waiver" : "Click here to View and Sign Waiver"}
        </Button>
      </div>
    </Card>
  );
};

export default WaiverSignatureComponent;
