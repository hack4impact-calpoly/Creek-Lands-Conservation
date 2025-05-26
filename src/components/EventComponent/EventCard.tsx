"use client";
import { Card, CardContent } from "@/components/ui/card";
import { EventInfoPreview } from "./EventInfoPreview";
import { Calendar, Clock, Users, CalendarClock, MapPin } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

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
  eventWaiverTemplates: { waiverId: string; required: boolean }[];
  onDelete?: (eventId: string) => void;
  onRegister?: (eventId: string, attendees: string[]) => void;
}

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
    eventWaiverTemplates,
    onDelete,
    onRegister,
  } = props;

  const backgroundImage =
    images[0] ||
    "https://creeklands.org/wp-content/uploads/2023/10/creek-lands-conservation-conservation-science-education-central-coast-yes-v1.jpg";

  const spotsLeft = capacity - currentRegistrations;
  const isAlmostFull = spotsLeft <= 5 && spotsLeft > 0;
  const isFull = spotsLeft <= 0;
  const isDeadlineSoon =
    registrationDeadline && new Date(registrationDeadline).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000;

  return (
    <Card className="overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow duration-300 hover:shadow-lg">
      {/* Compact Image Header */}
      <div className="relative h-32 bg-gray-100">
        <Image
          src={backgroundImage || "/placeholder.svg"}
          alt={eventTitle}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          style={{ objectFit: "cover" }}
        />
        <div className="absolute inset-0 bg-black/20" />

        {/* Status Badges */}
        <div className="absolute right-2 top-2 flex flex-col gap-1">
          {isFull && <Badge className="border-0 bg-red-600 px-2 py-1 text-xs text-white">Full</Badge>}
          {isAlmostFull && !isFull && (
            <Badge className="border-0 bg-orange-600 px-2 py-1 text-xs text-white">{spotsLeft} left</Badge>
          )}
          {isDeadlineSoon && (
            <Badge className="border-0 bg-yellow-600 px-2 py-1 text-xs text-white">Deadline Soon</Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        {/* Title and Location */}
        <div className="mb-3">
          <h3 className="mb-1 line-clamp-2 text-lg font-semibold leading-tight text-gray-900">{eventTitle}</h3>
          <div className="flex items-center gap-1 text-gray-600">
            <MapPin className="h-3 w-3" />
            <span className="truncate text-xs">{location}</span>
          </div>
        </div>

        {/* Compact Event Details */}
        <div className="mb-4 space-y-2 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            <span>
              {startDateTime ? new Date(startDateTime).toLocaleDateString() : "TBD"} -{" "}
              {endDateTime ? new Date(endDateTime).toLocaleDateString() : "TBD"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span>
              {startDateTime
                ? new Date(startDateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "TBD"}{" "}
              -{" "}
              {endDateTime
                ? new Date(endDateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "TBD"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CalendarClock className="h-3 w-3" />
            <span>Deadline: {registrationDeadline?.toLocaleDateString() || "TBD"}</span>
          </div>

          <div className="flex items-center gap-2">
            <Users className="h-3 w-3" />
            <div className="flex flex-1 items-center gap-2">
              <span>
                {currentRegistrations} / {capacity}
              </span>
              <div className="h-1.5 max-w-[60px] flex-1 rounded-full bg-gray-200">
                <div
                  className="h-1.5 rounded-full bg-green-600 transition-all duration-300"
                  style={{ width: `${Math.min((currentRegistrations / capacity) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
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
            eventWaiverTemplates,
            onDelete,
            onRegister,
          }}
        />
      </CardContent>
    </Card>
  );
}
