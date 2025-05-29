"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Calendar, Clock, MapPin, Mail, Text, ImageIcon, Users, CalendarClock, AlertCircle } from "lucide-react";
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
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import DOMPurify from "dompurify";
import { Badge } from "@/components/ui/badge";

interface EventInfoProps {
  id: string;
  title: string;
  startDateTime: string | null;
  endDateTime: string | null;
  location: string;
  description: string;
  images: string[];
  registrationDeadline: Date | null;
  email?: string;
  capacity?: number;
  currentRegistrations?: number;
  eventWaiverTemplates: { waiverId: string; required: boolean }[];
  onDelete?: (eventId: string) => void;
  onRegister?: (eventId: string, attendees: string[]) => void;
  neverRegistered?: boolean;
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
  email = "marysia@creeklands.org",
  capacity,
  currentRegistrations,
  eventWaiverTemplates,
  onDelete,
  onRegister,
  neverRegistered,
}: EventInfoProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const router = useRouter();
  const isAdmin = user?.publicMetadata?.userRole === "admin";
  const pathname = usePathname();
  const showRegisterButton = !pathname.startsWith("/admin/events");
  const sanitizedDescription = DOMPurify.sanitize(description);

  const hasRegistrationClosed = registrationDeadline ? new Date() > registrationDeadline : false;
  const isFull = capacity !== undefined && currentRegistrations !== undefined && currentRegistrations >= capacity;
  const spotsLeft = capacity && currentRegistrations ? capacity - currentRegistrations : 0;
  const isAlmostFull = spotsLeft <= 5 && spotsLeft > 0;
  const isRegisterDisabled = hasRegistrationClosed || isFull;

  const eventImages =
    images.length > 0
      ? images
      : [
          "https://creeklands.org/wp-content/uploads/2023/10/creek-lands-conservation-conservation-science-education-central-coast-yes-v1.jpg",
        ];

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

    const participants = [
      // Include parent only if selected
      ...(attendees.includes(userInfo.id)
        ? [
            {
              firstName: userInfo.firstName,
              lastName: userInfo.lastName,
              userID: userInfo.id,
              isChild: false,
            },
          ]
        : []),

      // Always include selected children
      ...userInfo.family
        .filter((m) => attendees.includes(m.id))
        .map((m) => ({
          firstName: m.firstName,
          lastName: m.lastName,
          userID: m.id,
          isChild: true,
        })),
    ];

    if (eventWaiverTemplates.length > 0) {
      // Waivers required, store participants and navigate to waiver page
      localStorage.setItem("waiverParticipants", JSON.stringify(participants));
      router.push(`/events/${id}/sign`);
    } else {
      // No waivers required, register directly
      try {
        const response = await fetch(`/api/events/${id}/registrations`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attendees }),
        });

        const responseData = await response.json();

        if (response.status === 409) {
          console.error("Profile incomplete:", responseData.error);
          localStorage.setItem("showProfileIncompleteToast", "true");

          router.push("/user");
        }

        if (!response.ok) throw new Error(responseData.error || "Failed to register for event.");

        setIsRegistered(true);
        setUserInfo((prev) => ({
          ...prev,
          alreadyRegistered: attendees.includes(prev.id) ? true : prev.alreadyRegistered,
          family: prev.family.map((member) => ({
            ...member,
            alreadyRegistered: attendees.includes(member.id) ? true : member.alreadyRegistered,
          })),
        }));

        onRegister?.(id, attendees);
        toast({
          title: "Registration successful",
          description: "You have been registered for the event.",
        });
        setIsRegisterDialogOpen(false);
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to register for the event.",
          variant: "destructive",
        });
      }
    }
  };

  const handleEditEvent = () => {
    router.push(`/admin/events/edit/${id}`);
  };

  const handleViewEvent = () => {
    router.push(`/admin/events/${id}/participants`);
  };

  const handleRegisterRedirect = () => {
    router.push(`/events/${id}`);
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button className="w-full bg-green-700 py-2 text-sm text-white hover:bg-green-800">View Details</Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] w-full max-w-[95%] overflow-hidden rounded-md bg-white md:max-w-[800px] lg:max-w-[900px]">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <DialogTitle className="text-center text-2xl font-bold text-gray-900">{title}</DialogTitle>
            <div className="mt-3 flex justify-center gap-2">
              {isFull && (
                <Badge className="border border-red-200 bg-red-100 text-xs text-red-800">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  Event Full
                </Badge>
              )}
              {isAlmostFull && !isFull && (
                <Badge className="border border-orange-200 bg-orange-100 text-xs text-orange-800">
                  Only {spotsLeft} spots remaining
                </Badge>
              )}
              {hasRegistrationClosed && (
                <Badge className="border border-gray-200 bg-gray-100 text-xs text-gray-800">Registration Closed</Badge>
              )}
            </div>
          </DialogHeader>

          <div className="max-h-[60vh] space-y-6 overflow-y-auto px-6 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                <Calendar className="h-4 w-4 text-gray-600" />
                <div>
                  <p className="text-xs font-medium text-gray-500">Date</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {startDateTime ? new Date(startDateTime).toLocaleDateString() : "TBD"} -{" "}
                    {endDateTime ? new Date(endDateTime).toLocaleDateString() : "TBD"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                <Clock className="h-4 w-4 text-gray-600" />
                <div>
                  <p className="text-xs font-medium text-gray-500">Time</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {startDateTime
                      ? new Date(startDateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "TBD"}{" "}
                    -{" "}
                    {endDateTime
                      ? new Date(endDateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "TBD"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                <MapPin className="h-4 w-4 text-gray-600" />
                <div>
                  <p className="text-xs font-medium text-gray-500">Location</p>
                  <p className="text-sm font-semibold text-gray-900">{location}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                <Mail className="h-4 w-4 text-gray-600" />
                <div>
                  <p className="text-xs font-medium text-gray-500">Contact</p>
                  <p className="text-sm font-semibold text-gray-900">{email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                <CalendarClock className="h-4 w-4 text-gray-600" />
                <div>
                  <p className="text-xs font-medium text-gray-500">Registration Deadline</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {registrationDeadline
                      ? registrationDeadline.toLocaleDateString() +
                        " at " +
                        registrationDeadline.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "TBD"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                <Users className="h-4 w-4 text-gray-600" />
                <div>
                  <p className="text-xs font-medium text-gray-500">Capacity</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">
                      {currentRegistrations} / {capacity}
                    </p>
                    <div className="h-2 min-w-[40px] flex-1 rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-green-600 transition-all duration-300"
                        style={{ width: `${Math.min((currentRegistrations! / capacity!) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-start gap-3">
                <Text className="mt-1 h-4 w-4 text-gray-600" />
                <div className="flex-1">
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">Event Description</h3>
                  <div
                    className="prose prose-sm max-w-none text-sm text-gray-700"
                    dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-start gap-3">
                <ImageIcon className="mt-1 h-4 w-4 text-gray-600" />
                <div className="flex-1">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">Event Photos</h3>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {eventImages.map((src, index) => (
                      <div key={index} className="flex-shrink-0">
                        <Image
                          src={src || "/placeholder.svg"}
                          alt={`Event Image ${index + 1}`}
                          width={200}
                          height={120}
                          className="h-24 w-32 rounded-lg border border-gray-200 object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between border-t border-gray-200 pt-4">
            {showRegisterButton &&
              (user ? (
                <Button
                  className="bg-green-700 px-6 py-2 text-white hover:bg-green-800"
                  onClick={handleRegisterRedirect}
                  disabled={isRegisterDisabled}
                >
                  {isFull
                    ? "Event Full"
                    : hasRegistrationClosed
                      ? "Registration Closed"
                      : neverRegistered
                        ? "Register for Event"
                        : "Manage Registration"}
                </Button>
              ) : (
                <SignInButton>
                  <Button className="bg-green-700 px-6 py-2 text-white hover:bg-green-800">Sign In to Register</Button>
                </SignInButton>
              ))}

            {isAdmin && onDelete && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleViewEvent} size="sm">
                  View Participants
                </Button>
                <Button variant="outline" onClick={handleEditEvent} size="sm">
                  Edit Event
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isDeleting}
                  size="sm"
                >
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
    </>
  );
}
