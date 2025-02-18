"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Clock, MapPin, Mail, Text, Image as ImageIcon, Users, CalendarClock } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface EventInfoProps {
  id: string;
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
  id,
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const eventImages =
    images.length > 0
      ? images
      : [
          "https://creeklands.org/wp-content/uploads/2023/10/creek-lands-conservation-conservation-science-education-central-coast-yes-v1.jpg",
        ];

  const handleDeleteEvent = async () => {
    setIsDeleting(true);
    try {
      console.log(id);
      console.log(title);
      const response = await fetch(`/api/events/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      toast({
        title: "Event deleted successfully",
        description: "The event has been removed from the system.",
      });

      router.push("/admin");
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
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
          <div
            className="max-h-[60vh] overflow-y-auto px-4 md:px-6 
            [&::-webkit-scrollbar-thumb]:rounded-full 
            [&::-webkit-scrollbar-thumb]:bg-slate-300 
            [&::-webkit-scrollbar-track]:bg-slate-100 
            [&::-webkit-scrollbar]:w-2"
          >
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
                  {startDateTime ? startDateTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "TBD"}{" "}
                  - {endDateTime ? endDateTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "TBD"}
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
                    <Image
                      src={src}
                      alt={`Event Image ${index + 1}`}
                      width={256}
                      height={180}
                      className="h-auto w-64 rounded-lg object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete Event"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the event and remove all associated
              registrations and waivers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEvent}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Event"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
