"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  MapPin,
  Mail,
  Text,
  Image as ImageIcon,
  Users,
  CalendarClock,
  X,
  Check,
  Download,
} from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

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
  userRegistered?: boolean;
  onDelete?: (eventId: string) => void;
}

interface AttendeeInfo {
  name: string;
  type: "adult" | "child";
}

interface RegisterDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  eventInfo: {
    title: string;
    date: string;
    time: string;
    location: string;
    contactEmail: string;
    waiverDueDate: string;
  };
  userInfo: {
    name: string;
    family: { name: string }[];
  };
  onConfirm: () => void;
}

const RegisterDialog = ({ isOpen, onOpenChange, eventInfo, userInfo, onConfirm }: RegisterDialogProps) => {
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [waiverEmail, setWaiverEmail] = useState("");
  const [waiverSigned, setWaiverSigned] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[60vw] min-w-[600px] p-8">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-3xl font-bold">Register for: {eventInfo.title}</DialogTitle>
          </div>

          <div className="mt-4 flex gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {eventInfo.date}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {eventInfo.time}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {eventInfo.location}
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {eventInfo.contactEmail}
            </div>
          </div>
        </DialogHeader>

        <div className="mt-6 grid grid-cols-2 gap-12">
          <div className="w-full">
            <h3 className="mb-4 font-semibold">Who&apos;s attending?</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id={userInfo.name}
                  checked={selectedAttendees.includes(userInfo.name)}
                  onCheckedChange={(checked) => {
                    setSelectedAttendees((prev) =>
                      checked ? [...prev, userInfo.name] : prev.filter((name) => name !== userInfo.name),
                    );
                  }}
                />
                <label
                  htmlFor={userInfo.name}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {userInfo.name}
                </label>
              </div>
              {userInfo.family.map((member) => (
                <div key={member.name} className="flex items-center space-x-3">
                  <Checkbox
                    id={member.name}
                    checked={selectedAttendees.includes(member.name)}
                    onCheckedChange={(checked) => {
                      setSelectedAttendees((prev) =>
                        checked ? [...prev, member.name] : prev.filter((name) => name !== member.name),
                      );
                    }}
                  />
                  <label
                    htmlFor={member.name}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {member.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">Waiver (Due {eventInfo.waiverDueDate})</h3>
            <p className="mb-4 text-sm text-gray-600">
              To attend this event, please sign this waiver first. You can sign it digitally or print, sign, and upload
              it.
            </p>

            <div className="space-y-4">
              <Button variant="secondary" className="w-full" onClick={() => window.open("/waiver.pdf", "_blank")}>
                <Download className="mr-2 h-4 w-4" />
                Download {eventInfo.title} Waiver
              </Button>

              <div className="text-center text-sm text-gray-600">or</div>

              <div>
                <label className="text-sm text-gray-600">Send waiver to this email (for printing)</label>
                <Input
                  placeholder="e.g. jameshudson345@gmail.com"
                  value={waiverEmail}
                  onChange={(e) => setWaiverEmail(e.target.value)}
                  className="mt-1"
                />
              </div>

              {waiverSigned ? (
                <Button variant="outline" className="w-full bg-green-500 text-white hover:bg-green-600">
                  <Check className="mr-2 h-4 w-4" />
                  Signed on {/* Add date here */}
                  <span className="ml-2 text-sm">Click here to view</span>
                </Button>
              ) : (
                <Button className="w-full bg-[#488644] text-white hover:bg-[#3a6d37]">Click here to sign waiver</Button>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          {!waiverSigned && (
            <Button className="mx-auto w-2/5 bg-[#488644] text-white hover:bg-[#3a6d37]" onClick={onConfirm}>
              Register for Event
            </Button>
          )}
          {waiverSigned && (
            <Button className="mx-auto w-2/5 bg-[#488644] text-white hover:bg-[#3a6d37]" onClick={onConfirm}>
              Sign and return to calendar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

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
  userRegistered,
  onDelete,
}: EventInfoProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [userFamily, setUserFamily] = useState<{ name: string }[]>([]);
  const { toast } = useToast();
  const { user } = useUser();
  const router = useRouter();
  const isAdmin = user?.publicMetadata?.userRole === "admin";

  // for registration validation
  const hasRegistrationClosed = registrationDeadline ? new Date() > registrationDeadline : false;
  const isFull = capacity !== undefined && currentRegistrations !== undefined && currentRegistrations >= capacity;
  const [isRegistered, setIsRegistered] = useState(false);
  const isRegisterDisabled = hasRegistrationClosed || isFull || isRegistered;

  const eventImages =
    images.length > 0
      ? images
      : [
          "https://creeklands.org/wp-content/uploads/2023/10/creek-lands-conservation-conservation-science-education-central-coast-yes-v1.jpg",
        ];

  // Fetch user's family information when dialog opens
  const fetchUserFamily = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/users/${user.id}`);
      if (!response.ok) throw new Error("Failed to fetch user data");

      const userData = await response.json();
      const familyMembers =
        userData.children?.map((child: any) => ({
          name: `${child.firstName || ""} ${child.lastName || ""}`.trim(),
        })) || [];

      setUserFamily(familyMembers);
    } catch (error) {
      console.error("Error fetching user family:", error);
      toast({
        title: "Error",
        description: "Failed to load family information",
        variant: "destructive",
      });
    }
  };

  // Fetch family data when register dialog opens
  const handleOpenRegisterDialog = () => {
    fetchUserFamily();
    setIsRegisterDialogOpen(true);
  };

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

      // Calls onDelete to remove deleted events from events instead of full reload
      if (onDelete) {
        onDelete(id);
      }
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

  const handleRegisterEvent = async () => {
    // make sure you are logged in to register
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
      console.log(id);
      console.log(title);
      const response = await fetch(`/api/events/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ registerForEvent: true }),
      });

      // Parse the response body as JSON and handle errors accordingly
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to register for event.");
      }

      // Wait for 3 seconds before reloading the page
      setTimeout(() => {
        window.location.reload(); // This will reload the page after the specified delay
      }, 3000);

      toast({
        title: "Registration successful",
        description: "You have been registered for the event.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to register for the event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
      setIsRegisterDialogOpen(false);
    }
  };

  const handleEditEvent = () => {
    router.push(`/admin/events/edit/${id}`); // Redirect user to the edit page
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
          </div>
          <DialogFooter className="flex justify-between">
            <Button
              className={`text-white ${userRegistered ? "cursor-not-allowed bg-gray-400" : "bg-green-500 hover:bg-green-600"}`}
              onClick={handleOpenRegisterDialog}
              disabled={isRegisterDisabled}
            >
              {isFull
                ? "Event Full"
                : hasRegistrationClosed
                  ? "Registration Closed"
                  : userRegistered
                    ? "Already Registered"
                    : "Sign Up"}
            </Button>
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

      <RegisterDialog
        isOpen={isRegisterDialogOpen}
        onOpenChange={setIsRegisterDialogOpen}
        eventInfo={{
          title: title,
          date: startDateTime ? startDateTime.toLocaleDateString() : "TBD",
          time: startDateTime ? startDateTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "TBD",
          location: location,
          contactEmail: email || "info@creeklands.org",
          waiverDueDate: registrationDeadline ? registrationDeadline.toLocaleDateString() : "TBD",
        }}
        userInfo={{
          name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
          family: userFamily,
        }}
        onConfirm={handleRegisterEvent}
      />
    </>
  );
}
