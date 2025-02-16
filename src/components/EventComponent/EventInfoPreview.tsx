import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Clock, MapPin, Mail, Text, Image as ImageIcon, Users, CalendarClock } from "lucide-react";
import Image from "next/image";

interface EventInfoProps {
  title: string;
  startDateTime: Date | null;
  endDateTime: Date | null;
  location: string;
  description: string;
  images: string[];
  registrationDeadline: Date | null;
  email?: string;
  capacity?: number;
  currentRegistrations?: number;
}

export function EventInfoPreview({
  title,
  startDateTime,
  endDateTime,
  location,
  description,
  images,
  registrationDeadline,
  email = "info@creeklands.org",
  capacity,
  currentRegistrations,
}: EventInfoProps) {
  const eventImages = images.length > 0 ? images : ["https://cdn.recreation.gov/public/images/66783.jpg"];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-gray-400 text-black">
          View Event Details
        </Button>
      </DialogTrigger>
      <DialogContent className="h-auto max-h-[80vh] w-full max-w-[90%] overflow-y-auto rounded-lg md:max-w-[800px] lg:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle className="text-center text-4xl">{title}</DialogTitle>
        </DialogHeader>
        <div className="custom-scrollbar px-6">
          <div className="grid grid-cols-1 gap-6 py-4 sm:grid-cols-2">
            <div className="grid grid-cols-[auto_1fr] items-center gap-4">
              <Calendar className="h-5 w-5" />
              <h1>
                {startDateTime ? startDateTime.toLocaleDateString() : "TBD"} -{" "}
                {endDateTime ? endDateTime.toLocaleDateString() : "TBD"}
              </h1>
            </div>
            <div className="grid grid-cols-[auto_1fr] items-center gap-4">
              <Clock className="h-5 w-5" />
              <h1>
                {startDateTime ? startDateTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "TBD"} -{" "}
                {endDateTime ? endDateTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "TBD"}
              </h1>
            </div>
            <div className="grid grid-cols-[auto_1fr] items-center gap-4">
              <MapPin className="h-5 w-5" />
              <h1>{location}</h1>
            </div>
            <div className="grid grid-cols-[auto_1fr] items-center gap-4">
              <Mail className="h-5 w-5" />
              <h1>{email}</h1>
            </div>
            <div className="grid grid-cols-[auto_1fr] items-center gap-4">
              <CalendarClock className="h-5 w-5" />
              <h1>
                Deadline:{" "}
                {registrationDeadline
                  ? registrationDeadline.toLocaleDateString() +
                    " " +
                    "-" +
                    " " +
                    registrationDeadline.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : "TBD"}
              </h1>
            </div>
            <div className="grid grid-cols-[auto_1fr] items-center gap-4">
              <Users className="h-5 w-5" />
              <h1>
                {currentRegistrations} / {capacity} spots filled
              </h1>
            </div>
          </div>

          <div className="grid items-start gap-4 py-4 sm:grid-cols-[auto_1fr]">
            <Text className="h-5 w-5" />
            <p>{description}</p>
          </div>

          <div className="grid items-start gap-4 py-4 sm:grid-cols-[auto_1fr]">
            <ImageIcon className="h-5 w-5" />
            <div className="scrollbar-hidden flex gap-4 overflow-x-auto py-4">
              {eventImages.map((src, index) => (
                <div key={index} className="flex-shrink-0">
                  <Image src={src} alt={`Event Image ${index + 1}`} className="h-auto w-64 rounded-lg object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
