"use client";

import { Card, CardContent } from "@/components/ui/card";
import { EventInfoPreview } from "./EventInfoPreview";
import { Calendar, Clock, Users, CalendarClock, LucideProps } from "lucide-react";
import { FaHourglassStart, FaHourglassEnd } from "react-icons/fa";
import Image from "next/image";

export interface EventCardProps {
  id: string;
  eventTitle: string;
  startDateTime: string | null;
  endDateTime: string | null;
  location: string;
  description: string;
  images: string[];
  registrationDeadline: Date | null;
  capacity: number;
  currentRegistrations: number;
  onDelete?: (eventId: string) => void;
  onRegister?: (eventId: string, attendees: string[]) => void;
}

const InfoRow = ({ icon: Icon, children }: { icon: React.ComponentType<LucideProps>; children: React.ReactNode }) => (
  <div className="flex items-center gap-2">
    <Icon className="h-5 w-5" />
    <span>{children}</span>
  </div>
);

const formatDate = (date: Date | null) => date?.toLocaleDateString() || "TBD";
const formatTime = (date: Date | null) => date?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) || "TBD";

const BackgroundImageLayer = ({ imageUrl, altText }: { imageUrl: string; altText: string }) => (
  <div className="absolute inset-0">
    <Image
      src={imageUrl}
      alt={altText}
      fill
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
      style={{ objectFit: "cover" }}
      className="brightness-110"
      priority
    />
    <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60" />
  </div>
);

export default function EventCard(props: EventCardProps) {
  const {
    id,
    eventTitle,
    startDateTime,
    endDateTime,
    location,
    description,
    images,
    registrationDeadline,
    capacity,
    currentRegistrations,
    onDelete,
    onRegister,
  } = props;

  const backgroundImage =
    images[0] ||
    "https://creeklands.org/wp-content/uploads/2023/10/creek-lands-conservation-conservation-science-education-central-coast-yes-v1.jpg";

  return (
    <Card className="relative w-full min-w-[312px] max-w-sm overflow-hidden rounded-lg bg-[#E5F4FA] shadow-lg">
      {/* <BackgroundImageLayer imageUrl={backgroundImage} altText={eventTitle} /> */}

      <CardContent className="relative flex flex-col gap-4 p-6">
        <h2 className="line-clamp-2 overflow-hidden text-2xl font-medium">{eventTitle}</h2>

        <div className="space-y-2 text-base lg:text-lg">
          {/* <InfoRow icon={Calendar}>
            <h1>
              {startDateTime ? new Date(startDateTime).toLocaleDateString() : "TBD"} -{" "}
              {endDateTime ? new Date(endDateTime).toLocaleDateString() : "TBD"}
            </h1>
          </InfoRow> */}
          <div className="flex items-center gap-2">
            <FaHourglassStart className="h-5 w-5" />
            <h1>
              {startDateTime ? new Date(startDateTime).toLocaleDateString() : "TBD"} -{" "}
              {startDateTime
                ? new Date(startDateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "TBD"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <FaHourglassEnd className="h-5 w-5" />
            <h1>
              {endDateTime ? new Date(endDateTime).toLocaleDateString() : "TBD"} -{" "}
              {endDateTime
                ? new Date(endDateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "TBD"}
            </h1>
          </div>

          {/* <InfoRow icon={Clock}>
            <h1>
              {startDateTime
                ? new Date(startDateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "TBD"}{" "}
              -{" "}
              {endDateTime
                ? new Date(endDateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "TBD"}
            </h1>
          </InfoRow> */}

          <InfoRow icon={CalendarClock}>Deadline: {registrationDeadline?.toLocaleString() || "TBD"}</InfoRow>

          <InfoRow icon={Users}>
            {currentRegistrations} / {capacity} spots filled
          </InfoRow>
        </div>

        <EventInfoPreview
          {...{
            id,
            title: eventTitle,
            startDateTime,
            endDateTime,
            location,
            description,
            images,
            registrationDeadline,
            capacity,
            currentRegistrations,
            onDelete,
            onRegister,
          }}
        />
      </CardContent>
    </Card>
  );
}
