"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  Search,
  UserCircle,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  User,
  Trash2,
  FileText,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { APIEvent, RegisteredUserInfo, RegisteredChildInfo } from "@/types/events";
import { useParams, useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import BackButton from "@/components/ui/back-button";
import Link from "next/link";
import useMobileDetection from "@/hooks/useMobileDetection";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Interface for waiver data
interface WaiverInfo {
  _id: string;
  fileKey: string;
  fileName: string;
  uploadedAt: Date;
  eventTitle: string;
}

// Helper functions (unchanged)
function getEventEmails(eventData: APIEvent): string[] {
  const emailsSet = new Set<string>();
  eventData.registeredUsers.forEach((ru: any) => {
    if (ru.user?.email) {
      emailsSet.add(ru.user.email);
    }
  });
  eventData.registeredChildren.forEach((rc: any) => {
    if (rc.parent?.email) {
      emailsSet.add(rc.parent.email);
    }
  });
  return Array.from(emailsSet);
}

function getEventAttendees(eventData: APIEvent) {
  const attendees: {
    id: string;
    firstName: string;
    lastName: string;
    birthday: Date | null;
    gender: string;
    medicalInfo: {
      photoRelease: boolean;
      allergies: string;
      dietaryRestrictions: string;
      insurance: string;
      doctorName: string;
      doctorPhone: string;
      behaviorNotes: string;
    };
    emergencyContacts: {
      name: string;
      phone: string;
      work?: string;
      relationship: string;
      canPickup: boolean;
    }[];
    isChild: boolean;
    parent: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phoneNumbers: { cell: string; work?: string };
      address: { home: string; city: string; zipCode: string };
    } | null;
    email?: string;
    phoneNumbers?: { cell: string; work?: string };
    address?: { home: string; city: string; zipCode: string };
    parentUserId?: string; // Add this for waiver lookup
  }[] = [];

  eventData.registeredChildren.forEach((child: RegisteredChildInfo) => {
    const childData = child.parent.children.find((c) => c._id === child.childId);
    if (childData) {
      attendees.push({
        id: childData._id,
        firstName: childData.firstName,
        lastName: childData.lastName,
        birthday: childData.birthday ? new Date(childData.birthday) : null,
        gender: childData.gender || "",
        medicalInfo: {
          photoRelease: childData.medicalInfo?.photoRelease ?? false,
          allergies: childData.medicalInfo?.allergies ?? "",
          dietaryRestrictions: childData.medicalInfo?.dietaryRestrictions ?? "",
          insurance: childData.medicalInfo?.insurance ?? "",
          doctorName: childData.medicalInfo?.doctorName ?? "",
          doctorPhone: childData.medicalInfo?.doctorPhone ?? "",
          behaviorNotes: childData.medicalInfo?.behaviorNotes ?? "",
        },
        emergencyContacts: childData.emergencyContacts || [],
        isChild: true,
        parent: {
          id: child.parent._id,
          firstName: child.parent.firstName,
          lastName: child.parent.lastName,
          email: child.parent.email,
          phoneNumbers: child.parent.phoneNumbers,
          address: child.parent.address,
        },
        address: childData.address || { home: "", city: "", zipCode: "" },
        parentUserId: child.parent._id,
      });
    }
  });

  eventData.registeredUsers.forEach((user: RegisteredUserInfo) => {
    attendees.push({
      id: user.user._id,
      firstName: user.user.firstName,
      lastName: user.user.lastName,
      birthday: user.user.birthday ? new Date(user.user.birthday) : null,
      gender: user.user.gender || "",
      medicalInfo: {
        photoRelease: user.user.medicalInfo?.photoRelease ?? false,
        allergies: user.user.medicalInfo?.allergies ?? "",
        dietaryRestrictions: user.user.medicalInfo?.dietaryRestrictions ?? "",
        insurance: user.user.medicalInfo?.insurance ?? "",
        doctorName: user.user.medicalInfo?.doctorName ?? "",
        doctorPhone: user.user.medicalInfo?.doctorPhone ?? "",
        behaviorNotes: user.user.medicalInfo?.behaviorNotes ?? "",
      },
      emergencyContacts: user.user.emergencyContacts || [],
      isChild: false,
      parent: null,
      email: user.user.email,
      phoneNumbers: user.user.phoneNumbers || { cell: "", work: "" },
      address: user.user.address || { home: "", city: "", zipCode: "" },
    });
  });

  return attendees;
}

function formatAttendeesForCSV(attendees: any[]) {
  return attendees.map((attendee) => ({
    "Attendee Name": `${attendee.firstName} ${attendee.lastName}`,
    "Parent/Guardian": attendee.parent ? `${attendee.parent.firstName} ${attendee.parent.lastName}` : "N/A (Self)",
    "Contact Email": attendee.parent ? attendee.parent.email : attendee.email || "Not provided",
    "Contact Phone": attendee.parent
      ? attendee.parent.phoneNumbers?.cell || "Not provided"
      : attendee.phoneNumbers?.cell || "Not provided",
    "Photo Release": attendee.medicalInfo.photoRelease ? "Yes" : "No",
    Birthday: attendee.birthday ? attendee.birthday.toLocaleDateString() : "Not provided",
    Gender: attendee.gender || "Not provided",
    Age: attendee.birthday ? calculateAge(attendee.birthday) : "Not provided",
    "Street Address": attendee.isChild
      ? attendee.address?.home || "Not provided"
      : attendee.address?.home || "Not provided",
    City: attendee.isChild ? attendee.address?.city || "Not provided" : attendee.address?.city || "Not provided",
    "Zip Code": attendee.isChild
      ? attendee.address?.zipCode || "Not provided"
      : attendee.address?.zipCode || "Not provided",
    Allergies: attendee.medicalInfo.allergies || "None",
    "Dietary Restrictions": attendee.medicalInfo.dietaryRestrictions || "None",
    "Behavior Notes": attendee.medicalInfo.behaviorNotes || "None",
    Insurance: attendee.medicalInfo.insurance || "None",
    "Doctor Name": attendee.medicalInfo.doctorName || "None",
    "Doctor Phone": attendee.medicalInfo.doctorPhone || "None",
  }));
}

function generateCSV(data: any[]) {
  if (data.length === 0) return "";
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map((row) =>
    Object.values(row)
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(","),
  );
  return [headers, ...rows].join("\n");
}

function handleExport(attendees: any[], eventName: string) {
  const formattedData = formatAttendeesForCSV(attendees);
  const csvContent = generateCSV(formattedData);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${eventName || "event"}-participants.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function createMailtoLink(emails: string[], eventName: string) {
  if (!emails.length) return null;
  const subject = encodeURIComponent(`${eventName} Update from CreekLandsConservation`);
  const body = encodeURIComponent(
    `Hi everyone,\n\nThis is an update regarding the upcoming event "${eventName}".\n\nThank you!`,
  );
  return `mailto:?bcc=${emails.join(",")}&subject=${subject}&body=${body}`;
}

export default function EventParticipantsPage() {
  const { eventID } = useParams();
  const [event, setEvent] = useState<{
    id: string;
    name: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    location: string;
  } | null>(null);
  const [attendees, setAttendees] = useState<
    {
      id: string;
      firstName: string;
      lastName: string;
      birthday: Date | null;
      gender: string;
      medicalInfo: {
        photoRelease: boolean;
        allergies: string;
        dietaryRestrictions: string;
        insurance: string;
        doctorName: string;
        doctorPhone: string;
        behaviorNotes: string;
      };
      emergencyContacts: {
        name: string;
        phone: string;
        work?: string;
        relationship: string;
        canPickup: boolean;
      }[];
      isChild: boolean;
      parent: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phoneNumbers: { cell: string; work?: string };
        address: { home: string; city: string; zipCode: string };
      } | null;
      email?: string;
      phoneNumbers?: { cell: string; work?: string };
      address?: { home: string; city: string; zipCode: string };
      parentUserId?: string;
    }[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [emailList, setEmailList] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [removingAttendee, setRemovingAttendee] = useState<string | null>(null);
  const [waiverDialogOpen, setWaiverDialogOpen] = useState(false);
  const [selectedWaivers, setSelectedWaivers] = useState<WaiverInfo[]>([]);
  const [currentWaiverUrl, setCurrentWaiverUrl] = useState<string | null>(null);
  const [currentWaiverTitle, setCurrentWaiverTitle] = useState<string>("");
  const [loadingWaivers, setLoadingWaivers] = useState(false);
  const router = useRouter();
  const isMobile = useMobileDetection();

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const response = await fetch(`/api/events/${eventID}`);
        if (!response.ok) {
          throw new Error("Failed to fetch event data");
        }
        const eventData: APIEvent = await response.json();

        setEvent({
          id: eventData.id,
          name: eventData.title,
          description: eventData.description,
          startDate: new Date(eventData.startDate),
          endDate: new Date(eventData.endDate),
          location: eventData.location,
        });

        const eventAttendees = getEventAttendees(eventData);
        setAttendees(eventAttendees);

        const emails = getEventEmails(eventData);
        setEmailList(emails);
      } catch (err) {
        console.error("Error fetching event data:", err);
        setError("Failed to load event details. Please try again later.");
      }
    };

    fetchEventData();
  }, [eventID]);

  const handleRemoveAttendee = async (attendeeId: string) => {
    setRemovingAttendee(attendeeId);
    try {
      const response = await fetch(`/api/events/${eventID}/registrations`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendees: [attendeeId] }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove participant");
      }

      setAttendees((prev) => prev.filter((a) => a.id !== attendeeId));
      setEmailList((prev) => {
        const attendee = attendees.find((a) => a.id === attendeeId);
        const email = attendee?.parent ? attendee.parent.email : attendee?.email;
        return email ? prev.filter((e) => e !== email) : prev;
      });

      toast({
        title: "Participant Removed",
        description: "The participant has been successfully removed from the event.",
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove participant.",
        variant: "destructive",
      });
    } finally {
      setRemovingAttendee(null);
    }
  };

  const handleViewWaivers = async (attendee: any) => {
    setLoadingWaivers(true);
    try {
      // Determine the user ID to query for waivers
      const userId = attendee.isChild ? attendee.parentUserId : attendee.id;

      // Fetch waivers for this attendee and event
      const response = await fetch(
        `/api/events/${eventID}/waivers/completed?userId=${userId}&childId=${attendee.isChild ? attendee.id : ""}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch waivers");
      }

      const waivers: WaiverInfo[] = await response.json();
      setSelectedWaivers(waivers);
      setWaiverDialogOpen(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load waivers.",
        variant: "destructive",
      });
    } finally {
      setLoadingWaivers(false);
    }
  };

  const handleViewWaiverDocument = async (waiver: WaiverInfo) => {
    try {
      setCurrentWaiverTitle(`${waiver.fileName} - ${waiver.eventTitle}`);

      // Fetch the presigned URL using the fileKey
      const presignedResponse = await fetch(
        `/api/s3/presigned-download?fileKey=${encodeURIComponent(waiver.fileKey)}`,
        {
          method: "GET",
        },
      );

      if (!presignedResponse.ok) {
        const errorData = await presignedResponse.json();
        throw new Error(errorData.error || "Failed to fetch presigned URL");
      }

      const presignedData = await presignedResponse.json();
      setCurrentWaiverUrl(presignedData.url);
    } catch (error: any) {
      console.error("Failed to view waiver:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load waiver document.",
        variant: "destructive",
      });
    }
  };

  // Define filteredAttendees
  const filteredAttendees = attendees.filter(
    (attendee) =>
      `${attendee.firstName} ${attendee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (attendee.parent &&
        `${attendee.parent.firstName} ${attendee.parent.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (attendee.parent && attendee.parent.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (attendee.email && attendee.email.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  if (error) {
    return <div className="container mx-auto py-6">{error}</div>;
  }

  if (!event) {
    return <ParticipantPageSkeleton />;
  }

  return (
    <div className="container mx-auto space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/events" className="mb-4 inline-block">
            <BackButton />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{event.name} - Participants</h1>
            <p className="text-muted-foreground">
              {event.startDate.toLocaleDateString()} at{" "}
              {event.startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} to{" "}
              {event.endDate.toLocaleDateString()} at{" "}
              {event.endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} at {event.location}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="default"
            onClick={() => {
              const mailto = createMailtoLink(emailList, event.name);
              if (mailto) {
                window.open(mailto, "_blank");
                toast({
                  title: "Opening email client",
                  description: "Your email client should open with the recipient list pre-filled.",
                });
              } else {
                toast({
                  title: "No recipients",
                  description: "There are no emails to send to.",
                  variant: "destructive",
                });
              }
            }}
          >
            Send Email to All
          </Button>
          <Button variant="default" onClick={() => handleExport(attendees, event.name)}>
            Export Participant List
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Participants</CardTitle>
          <CardDescription>Find participants by name or parent information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search participants..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Participants List</CardTitle>
          <CardDescription>{filteredAttendees.length} participants registered</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Attendee Name</TableHead>
                <TableHead>Parent/Guardian</TableHead>
                <TableHead>Contact Email</TableHead>
                <TableHead>Contact Phone</TableHead>
                <TableHead>Photo Release</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttendees.map((attendee) => (
                <AttendeeRow
                  key={attendee.id}
                  attendee={attendee}
                  onRemove={() => handleRemoveAttendee(attendee.id)}
                  onViewWaivers={() => handleViewWaivers(attendee)}
                  isRemoving={removingAttendee === attendee.id}
                  isLoadingWaivers={loadingWaivers}
                />
              ))}
            </TableBody>
          </Table>

          {filteredAttendees.length === 0 && (
            <div className="py-6 text-center text-muted-foreground">No participants found matching your search.</div>
          )}
        </CardContent>
      </Card>

      {/* Waivers List Dialog */}
      <Dialog open={waiverDialogOpen} onOpenChange={setWaiverDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Signed Waivers
            </DialogTitle>
            <DialogDescription>View all signed waivers for this participant</DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {selectedWaivers.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/60" />
                <p>No signed waivers found for this participant.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedWaivers.map((waiver) => (
                  <div
                    key={waiver._id}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{waiver.fileName}</p>
                        <p className="text-sm text-muted-foreground">
                          Signed on {new Date(waiver.uploadedAt).toLocaleDateString()}
                        </p>
                        <Badge variant="outline" className="mt-1">
                          {waiver.eventTitle}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewWaiverDocument(waiver)}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Waiver Document Preview Dialog */}
      <Dialog open={!!currentWaiverUrl} onOpenChange={() => setCurrentWaiverUrl(null)}>
        <DialogContent className={isMobile ? "max-w-[95vw] rounded-md" : "max-w-4xl rounded-md"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {currentWaiverTitle}
            </DialogTitle>
            <DialogDescription>Signed waiver document</DialogDescription>
          </DialogHeader>
          <div className="mt-4 overflow-hidden rounded-md border">
            {isMobile ? (
              currentWaiverUrl ? (
                <div className="flex flex-col items-center justify-center space-y-4 rounded-md bg-muted/20 p-6">
                  <p className="text-center text-sm text-muted-foreground">
                    For the best viewing experience on mobile, please open the waiver document in a new tab.
                  </p>
                  <Button
                    onClick={() => window.open(currentWaiverUrl, "_blank", "noopener,noreferrer")}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Open Waiver in New Tab
                  </Button>
                </div>
              ) : (
                <div className="flex h-[30vh] items-center justify-center bg-muted/10">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
                    <p className="text-sm text-muted-foreground">Loading document...</p>
                  </div>
                </div>
              )
            ) : currentWaiverUrl ? (
              <iframe
                src={currentWaiverUrl}
                title="Waiver Preview"
                className="h-[70vh] w-full rounded-md border-none"
              />
            ) : (
              <div className="flex h-[70vh] items-center justify-center bg-muted/10">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
                  <p className="text-sm text-muted-foreground">Loading document...</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Updated AttendeeRow component with View Waivers button
function AttendeeRow({
  attendee,
  onRemove,
  onViewWaivers,
  isRemoving,
  isLoadingWaivers,
}: {
  attendee: {
    id: string;
    firstName: string;
    lastName: string;
    birthday: Date | null;
    gender: string;
    medicalInfo: {
      photoRelease: boolean;
      allergies: string;
      dietaryRestrictions: string;
      insurance: string;
      doctorName: string;
      doctorPhone: string;
      behaviorNotes: string;
    };
    emergencyContacts: {
      name: string;
      phone: string;
      work?: string;
      relationship: string;
      canPickup: boolean;
    }[];
    isChild: boolean;
    parent: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phoneNumbers: { cell: string; work?: string };
      address: { home: string; city: string; zipCode: string };
    } | null;
    email?: string;
    phoneNumbers?: { cell: string; work?: string };
    address?: { home: string; city: string; zipCode: string };
  };
  onRemove: () => void;
  onViewWaivers: () => void;
  isRemoving: boolean;
  isLoadingWaivers: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const contactEmail = attendee.parent ? attendee.parent.email : attendee.email || "Not provided";
  const contactPhone = attendee.parent
    ? attendee.parent.phoneNumbers?.cell || "Not provided"
    : attendee.phoneNumbers?.cell || "Not provided";
  const parentDisplay = attendee.parent ? `${attendee.parent.firstName} ${attendee.parent.lastName}` : "N/A (Self)";

  return (
    <>
      <TableRow className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => setIsOpen(!isOpen)}>
        <TableCell>
          <div className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-muted">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
        </TableCell>
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            <UserCircle className="h-6 w-6 text-muted-foreground" />
            <span>
              {attendee.firstName} {attendee.lastName}
            </span>
          </div>
        </TableCell>
        <TableCell>{parentDisplay}</TableCell>
        <TableCell>{contactEmail}</TableCell>
        <TableCell>{contactPhone}</TableCell>
        <TableCell>
          {attendee.medicalInfo.photoRelease ? (
            <div className="flex items-center">
              <Check className="mr-1 h-5 w-5 text-green-500" />
              <span className="text-green-600">Yes</span>
            </div>
          ) : (
            <div className="flex items-center">
              <X className="mr-1 h-5 w-5 text-red-500" />
              <span className="text-red-600">No</span>
            </div>
          )}
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
                disabled={isRemoving || isLoadingWaivers}
              >
                {isRemoving || isLoadingWaivers ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-2 border-muted-foreground" />
                ) : (
                  <MoreHorizontal className="h-4 w-4" />
                )}
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onViewWaivers();
                }}
              >
                View Waivers
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-600">
                    Remove Participant
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Participant</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove {attendee.firstName} {attendee.lastName} from the event? This will
                      also remove their registration and associated waivers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onRemove}>Remove</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {isOpen && (
        <TableRow>
          <TableCell colSpan={7} className="p-0">
            <div className="m-2 rounded-md bg-muted/50 p-4">
              <Tabs defaultValue="personal">
                <TabsList className="mb-4">
                  <TabsTrigger value="personal">Attendee Info</TabsTrigger>
                  <TabsTrigger value="parent">Parent/Guardian</TabsTrigger>
                  <TabsTrigger value="emergency">Emergency Contacts</TabsTrigger>
                  <TabsTrigger value="medical">Medical Information</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InfoCard title="Attendee Details">
                      <InfoItem label="Full Name" value={`${attendee.firstName} ${attendee.lastName}`} />
                      <InfoItem label="Gender" value={attendee.gender} />
                      <InfoItem
                        label="Birthday"
                        value={attendee.birthday ? attendee.birthday.toLocaleDateString() : "Not provided"}
                      />
                      <InfoItem
                        label="Age"
                        value={attendee.birthday ? `${calculateAge(attendee.birthday)} years` : "Not provided"}
                      />
                    </InfoCard>

                    <InfoCard title="Address">
                      <InfoItem label="Street" value={attendee.address?.home || "Not provided"} />
                      <InfoItem label="City" value={attendee.address?.city || "Not provided"} />
                      <InfoItem label="Zip Code" value={attendee.address?.zipCode || "Not provided"} />
                    </InfoCard>
                  </div>
                </TabsContent>

                <TabsContent value="parent">
                  {attendee.parent ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <InfoCard title="Parent/Guardian Details">
                        <InfoItem
                          label="Full Name"
                          value={`${attendee.parent.firstName} ${attendee.parent.lastName}`}
                        />
                        <InfoItem label="Email" value={attendee.parent.email} />
                        <InfoItem label="Cell Phone" value={attendee.parent.phoneNumbers.cell} />
                        {attendee.parent?.phoneNumbers?.work && (
                          <InfoItem label="Work Phone" value={attendee.parent.phoneNumbers.work} />
                        )}
                      </InfoCard>
                    </div>
                  ) : (
                    <div className="rounded-md bg-muted p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-medium">Self-Registration</h3>
                      </div>
                      <p className="text-muted-foreground">This participant registered themselves for the event.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="emergency">
                  {attendee.emergencyContacts && attendee.emergencyContacts.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {attendee.emergencyContacts.map((contact, i) => (
                        <InfoCard key={i} title={`Contact ${i + 1}`}>
                          <InfoItem label="Name" value={contact.name} />
                          <InfoItem label="Phone" value={contact.phone} />
                          {contact.work && <InfoItem label="Work Phone" value={contact.work} />}
                          <InfoItem label="Relationship" value={contact.relationship} />
                          <InfoItem
                            label="Can Pickup"
                            value={contact.canPickup ? "Yes" : "No"}
                            valueClassName={contact.canPickup ? "text-green-600" : "text-red-600"}
                          />
                        </InfoCard>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No emergency contacts listed</p>
                  )}
                </TabsContent>

                <TabsContent value="medical">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <InfoCard title="Medical Conditions">
                        <InfoItem label="Allergies" value={attendee.medicalInfo.allergies || "None"} />
                        <InfoItem
                          label="Dietary Restrictions"
                          value={attendee.medicalInfo.dietaryRestrictions || "None"}
                        />
                        <InfoItem label="Behavior Notes" value={attendee.medicalInfo.behaviorNotes || "None"} />
                      </InfoCard>
                    </div>
                    <div className="space-y-4">
                      <InfoCard title="Medical Contacts">
                        <InfoItem label="Insurance" value={attendee.medicalInfo.insurance || "None"} />
                        <InfoItem label="Doctor Name" value={attendee.medicalInfo.doctorName || "None"} />
                        <InfoItem label="Doctor Phone" value={attendee.medicalInfo.doctorPhone || "None"} />
                      </InfoCard>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border bg-white p-4 dark:bg-gray-800">
      <h3 className="mb-2 font-medium">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoItem({ label, value, valueClassName = "" }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <span className="text-sm text-muted-foreground">{label}:</span>
      <span className={`text-sm font-medium ${valueClassName}`}>{value}</span>
    </div>
  );
}

function calculateAge(birthday: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthday.getFullYear();
  const monthDiff = today.getMonth() - birthday.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
    age--;
  }

  return age;
}

function ParticipantPageSkeleton() {
  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="mt-2 h-4 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-10 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="h-6 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="h-10 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="h-6 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <div className="h-4 w-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </TableHead>
                <TableHead>
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </TableHead>
                <TableHead>
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </TableHead>
                <TableHead>
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </TableHead>
                <TableHead>
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </TableHead>
                <TableHead>
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </TableHead>
                <TableHead>
                  <div className="h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(3)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="h-6 w-6 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                      <div className="h-4 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <div className="h-5 w-5 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                      <div className="h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="h-8 w-8 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
