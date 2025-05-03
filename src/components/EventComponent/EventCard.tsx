import { EventInfoPreview } from "./EventInfoPreview";
import Image from "next/image";
import { Calendar, MapPin } from "lucide-react";

interface EventCardProps {
  id: string;
  eventTitle: string;
  startDateTime: string | null;
  endDateTime: string | null;
  location: string;
  description: string;
  images: string[];
  registrationDeadline: Date | null;
  capacity?: number;
  currentRegistrations?: number;
  onDelete?: (eventId: string) => void;
  onRegister?: (eventId: string, attendees: string[]) => void;
  onCancelRegistration?: (eventId: string, attendees: string[]) => void;
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
  onDelete,
  onRegister,
  onCancelRegistration,
}: EventCardProps) {
  const eventImage =
    images && images.length > 0
      ? images[0]
      : "https://creeklands.org/wp-content/uploads/2023/10/creek-lands-conservation-conservation-science-education-central-coast-yes-v1.jpg";

  return (
    <div className="flex h-full w-full max-w-md flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md">
      <div className="relative h-48 w-full">
        <Image
          src={eventImage || "/placeholder.svg"}
          alt={eventTitle}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-2 text-xl font-bold">{eventTitle}</h3>
        <div className="mb-2 flex items-center text-sm text-gray-600">
          <Calendar className="mr-2 h-4 w-4" />
          <span>{startDateTime ? new Date(startDateTime).toLocaleDateString() : "TBD"}</span>
        </div>
        <div className="mb-4 flex items-center text-sm text-gray-600">
          <MapPin className="mr-2 h-4 w-4" />
          <span>{location}</span>
        </div>
        <p className="mb-4 line-clamp-3 flex-1 text-sm text-gray-700">{description.replace(/<[^>]*>?/gm, "")}</p>
        <div className="mt-auto">
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
            onDelete={onDelete}
            onRegister={onRegister}
            onCancelRegistration={onCancelRegistration}
          />
        </div>
      </div>
    </div>
  );
}
