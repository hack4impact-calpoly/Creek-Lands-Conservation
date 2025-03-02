"use client";

import { Card, CardContent } from "@/components/ui/card";
import { EventInfoPreview } from "./EventInfoPreview";
import { Calendar, Clock, Users, CalendarClock } from "lucide-react";
import Image from "next/image";

export interface EventCardProps {
  id: string;
  eventTitle: string;
  startDateTime: Date | null;
  endDateTime: Date | null;
  location: string;
  description: string;
  images: string[];
  registrationDeadline: Date | null;
  capacity: number;
  currentRegistrations: number;
  userRegistered?: boolean;
  onDelete?: (eventId: string) => void;
}

export default function EventCard({
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
  userRegistered,
  onDelete,
}: EventCardProps) {
  const backgroundImage =
    images.length > 0
      ? images[0]
      : "https://creeklands.org/wp-content/uploads/2023/10/creek-lands-conservation-conservation-science-education-central-coast-yes-v1.jpg";

  return (
    <Card className="relative w-full max-w-sm overflow-hidden rounded-lg shadow-lg">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={backgroundImage}
          alt={eventTitle}
          layout="fill" // Ensures it covers the container
          objectFit="cover"
          className="brightness-110" // Tailwind class for brightness
          priority // Ensures the image loads fast
        />
      </div>

      {/* Gradient Overlay for Better Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60"></div>

      {/* Card Content */}
      <CardContent className="relative flex flex-col gap-4 p-6 text-white">
        <h2 className="text-2xl font-medium">{eventTitle}</h2>
        <div className="space-y-2 text-lg">
          {/* Date */}
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span>
              {startDateTime ? startDateTime.toLocaleDateString() : "TBD"} -{" "}
              {endDateTime ? endDateTime.toLocaleDateString() : "TBD"}
            </span>
          </div>

          {/* Time */}
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span>
              {startDateTime ? startDateTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "TBD"} -{" "}
              {endDateTime ? endDateTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "TBD"}
            </span>
          </div>

          {/* Registration Deadline */}
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            <span>Deadline: {registrationDeadline ? registrationDeadline.toLocaleString() : "TBD"}</span>
          </div>

          {/* Current Registrations */}
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span>
              {currentRegistrations} / {capacity} spots filled
            </span>
          </div>
        </div>

        <EventInfoPreview
          id={id}
          title={eventTitle}
          startDateTime={startDateTime}
          endDateTime={endDateTime}
          location={location}
          description={description}
          images={images}
          registrationDeadline={registrationDeadline}
          capacity={capacity}
          currentRegistrations={currentRegistrations}
          userRegistered={userRegistered}
          onDelete={onDelete}
        />
      </CardContent>
    </Card>
  );
}
