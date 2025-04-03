"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
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
import { SignInButton } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { EventRegisterPreview } from "./EventRegisterPreview";
import DOMPurify from "dompurify";

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
  onDelete?: (eventId: string) => void;
  onRegister?: (eventId: string, attendees: string[]) => void;
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
  onDelete,
  onRegister,
}: EventInfoProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    id: string;
    name: string;
    alreadyRegistered: boolean;
    family: { id: string; name: string; alreadyRegistered: boolean }[];
  }>({
    id: "",
    name: "",
    alreadyRegistered: false,
    family: [],
  });
  const { toast } = useToast();
  const { user } = useUser();
  const router = useRouter();
  const isAdmin = user?.publicMetadata?.userRole === "admin";
  const sanitizedDescription = DOMPurify.sanitize(description);

  const hasRegistrationClosed = registrationDeadline ? new Date() > registrationDeadline : false;
  const isFull = capacity !== undefined && currentRegistrations !== undefined && currentRegistrations >= capacity;
  const [isRegistered, setIsRegistered] = useState(false);
  const isRegisterDisabled = hasRegistrationClosed || isFull;

  const eventImages =
    images.length > 0
      ? images
      : [
          "https://creeklands.org/wp-content/uploads/2023/10/creek-lands-conservation-conservation-science-education-central-coast-yes-v1.jpg",
        ];

  const fetchUserFamily = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/users/${user.id}`);
      if (!response.ok) throw new Error("Failed to fetch user data");

      const userData = await response.json();
      const family =
        userData.children?.map((child: any) => ({
          id: child._id,
          name: `${child.firstName || ""} ${child.lastName || ""}`.trim(),
          alreadyRegistered: child.registeredEvents.includes(id),
        })) || [];

      setUserInfo({
        id: userData._id,
        name: `${userData?.firstName || ""} ${userData?.lastName || ""}`.trim(),
        alreadyRegistered: userData.registeredEvents.includes(id),
        family,
      });
      console.log("Fetched user family:", family);
    } catch (error) {
      console.error("Error fetching user family:", error);
      toast({
        title: "Error",
        description: "Failed to load family information",
        variant: "destructive",
      });
    }
  };

  const handleOpenRegisterDialog = () => {
    fetchUserFamily();
    setIsRegisterDialogOpen(true);
  };

  const handleDeleteEvent = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete event");

      toast({
        title: "Event deleted successfully",
        description: "The event has been removed from the system.",
      });

      if (onDelete) onDelete(id);
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

  const handleRegisterEvent = async (attendees: string[]) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to register.",
        variant: "destructive",
      });
      return;
    }

    setIsRegistering(true);

    try {
      console.log("Registering attendees:", attendees, "User ID:", userInfo.id);
      const response = await fetch(`/api/events/${id}/registrations`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendees }),
      });

      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.error || "Failed to register for event.");

      // Update local state
      setIsRegistered(true);
      setUserInfo((prev) => {
        const userIsAttendee = attendees.includes(prev.id);
        console.log("User is attendee:", userIsAttendee);
        return {
          ...prev,
          alreadyRegistered: userIsAttendee ? true : prev.alreadyRegistered,
          family: prev.family.map((member) => ({
            ...member,
            alreadyRegistered: attendees.includes(member.id) ? true : member.alreadyRegistered,
          })),
        };
      });

      console.log("Parent Signup");
      onRegister?.(id, attendees);
      toast({
        title: "Registration successful",
        description: "You have been registered for the event.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to register for the event.",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
      setIsRegisterDialogOpen(false);
    }
  };

  const handleEditEvent = () => {
    router.push(`/admin/events/edit/${id}`);
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="border-gray-400 bg-[#488644] text-white">
            View Event Details
          </Button>
        </DialogTrigger>
        <DialogContent className="h-auto max-h-[80vh] w-full max-w-[90%] overflow-y-auto rounded-lg md:max-w-[800px] lg:max-w-[1000px]">
          <DialogHeader>
            <DialogTitle className="text-center text-4xl">{title}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto px-4 md:px-6">
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
              <div className="prose" dangerouslySetInnerHTML={{ __html: sanitizedDescription }} />
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
          </div>
          <DialogFooter className="flex justify-between">
            {user ? (
              <Button
                className="bg-[#488644] text-white hover:bg-[#3a6d37]"
                onClick={handleOpenRegisterDialog}
                disabled={isRegisterDisabled}
              >
                {isFull ? "Event Full" : hasRegistrationClosed ? "Registration Closed" : "Register"}
              </Button>
            ) : (
              <SignInButton>
                <Button className="bg-[#488644] text-white hover:bg-[#3a6d37]">Sign In to Register</Button>
              </SignInButton>
            )}

            {isAdmin && onDelete && (
              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => handleEditEvent()}>
                  Edit Event
                </Button>
                <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} disabled={isDeleting}>
                  {isDeleting ? "Deleting..." : "Delete Event"}
                </Button>
              </div>
            )}
          </DialogFooter>
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

      {!isFull && (
        <EventRegisterPreview
          isOpen={isRegisterDialogOpen}
          onOpenChange={setIsRegisterDialogOpen}
          eventInfo={{
            title: title,
            startDate: startDateTime ? startDateTime.toLocaleDateString() : "TBD",
            endDate: endDateTime ? endDateTime.toLocaleDateString() : "TBD",
            startTime: startDateTime
              ? startDateTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "TBD",
            endTime: endDateTime ? endDateTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "TBD",
            location: location,
            contactEmail: email || "info@creeklands.org",
          }}
          userInfo={userInfo}
          onConfirm={handleRegisterEvent}
        />
      )}
    </>
  );
}
