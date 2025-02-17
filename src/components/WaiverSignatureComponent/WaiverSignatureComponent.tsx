import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CircleCheck } from "lucide-react";

interface WaiverSignatureProps {
  eventName: string;
  eventDate: Date;
  eventTime: string;
  signed: boolean;
  signatureDate?: Date;
  signByDate?: Date;
  onViewWaiver: () => void;
  onSignWaiver?: () => void;
}

const getDateString = (date: Date) =>
  new Intl.DateTimeFormat("en-US", { month: "numeric", day: "numeric", year: "2-digit" }).format(date);
const getWeekDay = (date: Date) => new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);

const WaiverSignatureComponent: React.FC<WaiverSignatureProps> = ({
  eventName,
  eventDate,
  eventTime,
  signed,
  signatureDate,
  signByDate,
  onViewWaiver,
  onSignWaiver,
}) => {
  const eventDay = getWeekDay(eventDate);
  const eventDateString = getDateString(eventDate);
  const signatureDateString = signatureDate && getDateString(signatureDate);
  const signByDateString = signByDate && getDateString(signByDate);

  return (
    <Card className="flex w-full items-center justify-between gap-3 rounded-lg bg-gray-100 p-4 shadow-md">
      <div className="flex flex-wrap items-center gap-2 md:gap-4 xl:gap-10">
        <div className="truncate text-sm font-semibold sm:text-base lg:text-lg">{eventName}</div>
        <div className="flex flex-row items-center gap-1 text-sm sm:text-base">
          <div className="hidden text-gray-600 sm:block">{eventDay}</div>
          <div className="text-gray-600">{eventDateString}</div>
        </div>
        <div className="hidden text-gray-600 md:block">{eventTime}</div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-2 sm:gap-4">
        <Button
          onClick={signed ? onViewWaiver : onSignWaiver}
          variant="default"
          className={`gap-1 rounded-lg px-2 py-3 text-sm font-semibold sm:px-3 sm:py-4 sm:text-base lg:px-4 lg:py-6 lg:text-lg ${
            signed ? "bg-green-500 text-black" : "bg-red-500 text-white"
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
          className="hidden rounded-lg bg-gray-500 px-4 py-6 text-base text-white transition hover:bg-gray-600 lg:flex"
          onClick={signed ? onViewWaiver : onSignWaiver}
        >
          {signed ? "Click here to View Waiver" : "Click here to View and Sign Waiver"}
        </Button>
      </div>
    </Card>
  );
};

export default WaiverSignatureComponent;
