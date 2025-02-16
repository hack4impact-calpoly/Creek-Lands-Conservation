"use client";

import { Card, CardContent } from "@/components/ui/card";
import { EventInfoPreview } from "./EventInfoPreview";
import { Calendar, Clock, Users, CalendarClock } from "lucide-react";

export interface EventCardProps {
  eventTitle: string;
  startDateTime: Date | null;
  endDateTime: Date | null;
  location: string;
  description: string;
  images: string[];
  registrationDeadline: Date | null;
  capacity: number;
  currentRegistrations: number;
}

export default function EventCard({
  eventTitle,
  startDateTime,
  endDateTime,
  location,
  description,
  images,
  registrationDeadline,
  capacity,
  currentRegistrations,
}: EventCardProps) {
  const backgroundImage = images.length > 0 ? images[0] : "https://cdn.recreation.gov/public/images/66783.jpg";

  return (
    <Card className="relative w-full max-w-sm overflow-hidden rounded-lg shadow-lg">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          filter: "brightness(1.1)", // Slightly brightens the image
        }}
      ></div>

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
          title={eventTitle}
          startDateTime={startDateTime}
          endDateTime={endDateTime}
          location={location}
          description={description}
          images={images}
          registrationDeadline={registrationDeadline}
          capacity={capacity}
          currentRegistrations={currentRegistrations}
        />
      </CardContent>
    </Card>
  );
}
