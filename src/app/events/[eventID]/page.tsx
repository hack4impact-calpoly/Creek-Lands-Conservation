"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  Mail,
  Text,
  Users,
  CalendarClock,
  AlertCircle,
  ArrowLeft,
  DollarSign,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SignInButton, useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import DOMPurify from "dompurify";
import { Checkbox } from "@/components/ui/checkbox";
import { getEventById } from "@/app/actions/events/actions";
import type { LimitedEventInfo } from "@/types/events";

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, isSignedIn } = useUser();
  const [event, setEvent] = useState<LimitedEventInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullUserData, setFullUserData] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    alreadyRegistered: boolean;
    family: { id: string; firstName: string; lastName: string; alreadyRegistered: boolean }[];
  }>({
    id: "",
    firstName: "",
    lastName: "",
    alreadyRegistered: false,
    family: [],
  });
  const [selectedAttendeesToRegister, setSelectedAttendeesToRegister] = useState<string[]>([]);
  const [selectedAttendeesToCancel, setSelectedAttendeesToCancel] = useState<string[]>([]);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const id = Array.isArray(params.eventID) ? params.eventID[0] : params.eventID;
        if (!id || typeof id !== "string") {
          throw new Error("Invalid or missing event ID");
        }
        // console.log("Fetching event for ID:", id);
        const eventData = await getEventById(id);
        // console.log("Fetched event data:", eventData);
        if (!eventData) {
          throw new Error("Event not found");
        }
        setEvent(eventData);
      } catch (error) {
        console.error("Error fetching event:", error);
        setError(error instanceof Error ? error.message : "Failed to load event details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [params.eventID]);

  useEffect(() => {
    const fetchUserFamily = async () => {
      if (!user?.id || !event || userInfo.id) return;

      try {
        const response = await fetch(`/api/users/${user.id}`);
        if (!response.ok) throw new Error("Failed to fetch user data");

        const userData = await response.json();
        // ("Fetched user data:", userData);
        setFullUserData(userData);
        setUserInfo({
          id: userData._id,
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          alreadyRegistered: userData.registeredEvents.includes(event.id),
          family:
            userData.children?.map((child: any) => ({
              id: child._id,
              firstName: child.firstName || "",
              lastName: child.lastName || "",
              alreadyRegistered: child.registeredEvents.includes(event.id),
            })) || [],
        });
      } catch (error) {
        console.error("Error fetching user family:", error);
        toast({
          title: "Error",
          description: "Failed to load family information",
          variant: "destructive",
        });
      }
    };

    if (event && event.fee > 0) {
      localStorage.setItem("eventFee", event.fee.toString());
      localStorage.setItem("eventTitle", event.title);
      localStorage.setItem("userId", userInfo.id);
    }

    fetchUserFamily();
  }, [user?.id, event, toast]);

  const validateAttendee = (fullUserData: any, attendeeId: string) => {
    // console.log(`Validating attendee with ID: ${attendeeId}`);

    let attendeeData;
    let isChild = false;

    // Determine if the attendee is the user or a child
    if (attendeeId === fullUserData._id) {
      attendeeData = fullUserData;
      // console.log("Checking primary user:", {
      //   id: attendeeData._id,
      //   firstName: attendeeData.firstName,
      //   lastName: attendeeData.lastName,
      // });
    } else {
      attendeeData = fullUserData.children.find((c: any) => c._id === attendeeId);
      isChild = true;
      if (!attendeeData) {
        // console.log(`Child with ID ${attendeeId} not found in fullUserData.children`);
        return false;
      }
      // console.log("Checking child:", {
      //   id: attendeeData._id,
      //   firstName: attendeeData.firstName,
      //   lastName: attendeeData.lastName,
      // });
    }

    // Validate basic required fields
    const requiredFields = ["firstName", "lastName", "birthday", "gender"];
    for (const field of requiredFields) {
      // console.log(`Checking ${field}:`, attendeeData[field]);
      if (!attendeeData[field]) {
        // console.log(`Validation failed: ${field} is missing or empty`);
        return false;
      }
    }

    // Validate address - for children, use parent's address if child doesn't have one
    let addressToCheck;
    if (isChild) {
      // For children, check if they have their own address, otherwise use parent's
      if (
        attendeeData.address &&
        attendeeData.address.home &&
        attendeeData.address.city &&
        attendeeData.address.zipCode
      ) {
        addressToCheck = attendeeData.address;
        // console.log("Using child's own address:", addressToCheck);
      } else {
        addressToCheck = fullUserData.address;
        // console.log("Child uses parent's address:", addressToCheck);
      }
    } else {
      addressToCheck = attendeeData.address;
      // console.log("Using adult's own address:", addressToCheck);
    }

    // console.log("Address details:", {
    //   home: addressToCheck?.home,
    //   city: addressToCheck?.city,
    //   zipCode: addressToCheck?.zipCode,
    // });

    if (!addressToCheck || !addressToCheck.home || !addressToCheck.city || !addressToCheck.zipCode) {
      // console.log("Validation failed: Address or its subfields are missing/empty");
      return false;
    }

    // Validate emergency contacts - for children, use parent's if child doesn't have any
    let contactsToCheck;
    if (isChild) {
      // For children, check if they have their own emergency contacts, otherwise use parent's
      if (attendeeData.emergencyContacts && attendeeData.emergencyContacts.length > 0) {
        contactsToCheck = attendeeData.emergencyContacts;
        // console.log("Using child's own emergency contacts:", contactsToCheck);
      } else {
        contactsToCheck = fullUserData.emergencyContacts;
        // console.log("Child uses parent's emergency contacts:", contactsToCheck);
      }
    } else {
      contactsToCheck = attendeeData.emergencyContacts;
      // console.log("Using adult's own emergency contacts:", contactsToCheck);
    }

    // console.log("Emergency contacts count:", contactsToCheck?.length || 0);
    if (!contactsToCheck || contactsToCheck.length === 0) {
      // console.log("Validation failed: No emergency contacts provided");
      return false;
    }

    const hasValidContact = contactsToCheck.some((contact: any) => contact.name && contact.phone);
    // console.log("Has valid contact (name and phone):", hasValidContact);
    if (!hasValidContact) {
      // console.log("Validation failed: No valid emergency contact with name and phone");
      return false;
    }

    // Validate medical info - this should be on the individual (child or adult)
    // console.log("Medical info:", attendeeData.medicalInfo);
    if (!attendeeData.medicalInfo) {
      // console.log("Validation failed: Medical info is missing");
      return false;
    }

    // Check that important fields in medical info are not empty
    if (
      attendeeData.medicalInfo.allergies === "" ||
      attendeeData.medicalInfo.dietaryRestrictions === "" ||
      attendeeData.medicalInfo.insurance === "" ||
      attendeeData.medicalInfo.doctorName === "" ||
      attendeeData.medicalInfo.doctorPhone === ""
    ) {
      // console.log("Validation failed: Medical info allergies or dietary restrictions are undefined");
      return false;
    }

    // console.log(`Validation passed for attendee ID: ${attendeeId}`);
    return true;
  };

  const eventId = typeof params.eventID === "string" ? params.eventID : "";
  const hasRegistrationClosed = event?.registrationDeadline ? new Date() > new Date(event.registrationDeadline) : false;
  const isFull = event?.capacity && (event?.currentRegistrations ?? 0) >= event?.capacity;
  const spotsLeft = event?.capacity ? event.capacity - (event?.currentRegistrations ?? 0) : 0;
  const isAlmostFull = spotsLeft <= 5 && spotsLeft > 0;
  const registerDisabled = hasRegistrationClosed || isFull;

  const participants = selectedAttendeesToRegister.map((id) => {
    if (id === userInfo.id) {
      return {
        userID: id,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        isChild: false,
      };
    }
    const familyMember = userInfo.family.find((m) => m.id === id);
    if (!familyMember) {
      throw new Error(`Family member with ID ${id} not found`);
    }
    return {
      userID: id,
      firstName: familyMember.firstName,
      lastName: familyMember.lastName,
      isChild: true,
    };
  });

  const handleRegister = async () => {
    if (!selectedAttendeesToRegister.length) {
      toast({
        title: "No Attendees Selected",
        description: "Please select at least one attendee to register.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!eventId) throw new Error("Invalid event ID");
      if (!event) throw new Error("Event data not loaded");
      if (!fullUserData) throw new Error("User data not loaded");

      console.log("Validating attendees:", selectedAttendeesToRegister);

      // Validate all selected attendees
      const invalidAttendees = selectedAttendeesToRegister.filter((id) => !validateAttendee(fullUserData, id));

      console.log("Invalid attendees:", invalidAttendees);

      if (invalidAttendees.length > 0) {
        toast({
          title: "Incomplete Profile",
          description: "Please complete all required information for the selected attendees in your profile.",
          variant: "destructive",
        });
        router.push("/user");
        return;
      }

      // Proceed if all validations pass
      if (event.eventWaiverTemplates.length > 0) {
        console.log("Participants for waiver:", participants);
        localStorage.setItem("waiverParticipants", JSON.stringify(participants));
        router.push(`/events/${eventId}/sign`);
        return;
      }

      const response = await fetch(`/api/events/${eventId}/registrations`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendees: selectedAttendeesToRegister }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to register for event.");

      toast({
        title: "Success",
        description: `Registered ${selectedAttendeesToRegister.length} attendee(s).`,
      });

      setUserInfo((prev) => ({
        ...prev,
        alreadyRegistered: selectedAttendeesToRegister.includes(prev.id) ? true : prev.alreadyRegistered,
        family: prev.family.map((member) => ({
          ...member,
          alreadyRegistered: selectedAttendeesToRegister.includes(member.id) ? true : member.alreadyRegistered,
        })),
      }));

      setEvent((prev) =>
        prev
          ? {
              ...prev,
              currentRegistrations: (prev.currentRegistrations ?? 0) + selectedAttendeesToRegister.length,
            }
          : null,
      );

      setSelectedAttendeesToRegister([]);
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to register for the event.",
        variant: "destructive",
      });
    }
  };

  const handlePayment = async () => {
    if (!selectedAttendeesToRegister.length) {
      toast({
        title: "No Attendees Selected",
        description: "Please select at least one attendee to register.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!eventId) throw new Error("Invalid event ID");
      if (!event) throw new Error("Event data not loaded");
      if (!fullUserData) throw new Error("User data not loaded");

      // Validate all selected attendees
      const invalidAttendees = selectedAttendeesToRegister.filter((id) => !validateAttendee(fullUserData, id));

      if (invalidAttendees.length > 0) {
        toast({
          title: "Incomplete Profile",
          description: "Please complete all required information for the selected attendees in your profile.",
          variant: "destructive",
        });
        router.push("/user");
        return;
      }

      const parsedFee = Math.round(event.fee * 100); // Convert to cents
      const eventData = {
        title: event.title,
        fee: parsedFee, // Fee in cents
        quantity: participants?.length,
        eventId: eventId,
        attendees: participants?.map((participants) => participants.userID), // only pass userID
        userId: userInfo.id,
      };

      const res = await fetch("/api/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      const data = await res.json();
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
      } else {
        console.error("Stripe error:", data.error);
      }
    } catch (error) {
      console.error("Validation error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to validate attendees.",
        variant: "destructive",
      });
      return;
    }
  };

  const handleCancelRegistration = async () => {
    if (!selectedAttendeesToCancel.length) {
      toast({
        title: "No Attendees Selected",
        description: "Please select at least one attendee to cancel.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!eventId) throw new Error("Invalid event ID");
      const response = await fetch(`/api/events/${eventId}/registrations`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendees: selectedAttendeesToCancel }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to cancel registration.");

      toast({
        title: "Success",
        description: `Registration cancelled for ${selectedAttendeesToCancel.length} attendee(s).`,
      });

      setUserInfo((prev) => ({
        ...prev,
        alreadyRegistered: selectedAttendeesToCancel.includes(prev.id) ? false : prev.alreadyRegistered,
        family: prev.family.map((member) => ({
          ...member,
          alreadyRegistered: selectedAttendeesToCancel.includes(member.id) ? false : member.alreadyRegistered,
        })),
      }));

      setEvent((prev) =>
        prev
          ? {
              ...prev,
              currentRegistrations: Math.max(0, (prev.currentRegistrations ?? 0) - selectedAttendeesToCancel.length),
            }
          : null,
      );

      setSelectedAttendeesToCancel([]);
    } catch (error) {
      console.error("Cancel registration error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel registration.",
        variant: "destructive",
      });
    }
  };

  if (!eventId) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="mb-4 text-2xl font-bold text-red-600">Invalid Event ID</h1>
        <p className="mb-6 text-gray-600">Please provide a valid event ID.</p>
        <Button onClick={() => router.push("/events")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Events
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-1/3 rounded bg-gray-200"></div>
          <div className="h-64 rounded bg-gray-200"></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 rounded bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="mb-4 text-2xl font-bold text-red-600">Event Not Found</h1>
        <p className="mb-6 text-gray-600">{error}</p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  const eventImages =
    event.images.length > 0
      ? event.images
      : [
          "https://creeklands.org/wp-content/uploads/2023/10/creek-lands-conservation-conservation-science-education-central-coast-yes-v1.jpg",
        ];

  const sanitizedDescription = DOMPurify.sanitize(event.description || "");

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Button variant="ghost" onClick={() => router.push("/")} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Events
      </Button>

      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold text-gray-900">{event.title}</h1>
        <div className="flex flex-wrap gap-2">
          {isFull && (
            <Badge className="border border-red-200 bg-red-100 text-red-800">
              <AlertCircle className="mr-1 h-3 w-3" />
              Event Full
            </Badge>
          )}
          {isAlmostFull && !isFull && (
            <Badge className="border border-orange-200 bg-orange-100 text-orange-800">
              Only {spotsLeft} spots remaining
            </Badge>
          )}
          {hasRegistrationClosed && (
            <Badge className="border border-gray-200 bg-gray-100 text-gray-800">Registration Closed</Badge>
          )}
        </div>
      </div>

      <div className="mb-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {eventImages.map((src, index) => (
            <div key={index} className="relative aspect-video">
              <Image
                src={src || "/placeholder.svg"}
                alt={`Event Image ${index + 1}`}
                fill
                className="rounded-lg object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Calendar className="h-5 w-5 text-gray-600" />
            <div>
              <p className="text-sm font-medium text-gray-500">Date</p>
              <p className="font-semibold text-gray-900">
                {event.startDate ? new Date(event.startDate).toLocaleDateString() : "TBD"} -{" "}
                {event.endDate ? new Date(event.endDate).toLocaleDateString() : "TBD"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-5 w-5 text-gray-600" />
            <div>
              <p className="text-sm font-medium text-gray-500">Time</p>
              <p className="font-semibold text-gray-900">
                {event.startDate
                  ? new Date(event.startDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : "TBD"}{" "}
                -{" "}
                {event.endDate
                  ? new Date(event.endDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : "TBD"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <MapPin className="h-5 w-5 text-gray-600" />
            <div>
              <p className="text-sm font-medium text-gray-500">Location</p>
              <p className="font-semibold text-gray-900">{event.location}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Mail className="h-5 w-5 text-gray-600" />
            <div>
              <p className="text-sm font-medium text-gray-500">Contact</p>
              <p className="font-semibold text-gray-900">marysia@creeklands.org</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CalendarClock className="h-5 w-5 text-gray-600" />
            <div>
              <p className="text-sm font-medium text-gray-500">Registration Deadline</p>
              <p className="font-semibold text-gray-900">
                {event.registrationDeadline
                  ? new Date(event.registrationDeadline).toLocaleDateString() +
                    " at " +
                    new Date(event.registrationDeadline).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : "TBD"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-5 w-5 text-gray-600" />
            <div>
              <p className="text-sm font-medium text-gray-500">Capacity</p>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900">
                  {event.currentRegistrations ?? 0} / {event.capacity ?? "Unlimited"}
                </p>
                {event.capacity && (
                  <div className="h-2 min-w-[60px] flex-1 rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-green-600 transition-all duration-300"
                      style={{ width: `${Math.min(((event.currentRegistrations ?? 0) / event.capacity) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <DollarSign className="h-5 w-5 text-gray-600" />
            <div>
              <p className="text-sm font-medium text-gray-500">Fee</p>
              <p className="font-semibold text-gray-900">{event.fee}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Text className="mt-1 h-5 w-5 text-gray-600" />
            <div className="flex-1">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">Event Description</h3>
              <div
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isSignedIn && userInfo.id ? (
        <div className="mb-8">
          {userInfo.alreadyRegistered || userInfo.family.some((m) => m.alreadyRegistered) ? (
            <div className="space-y-6">
              <div>
                <h2 className="mb-4 text-2xl font-semibold text-gray-900">Your Current Registrations</h2>
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      <span className="font-medium text-green-800">You are registered for this event</span>
                    </div>
                    <div className="space-y-2">
                      {userInfo.alreadyRegistered && (
                        <div className="text-sm text-green-700">
                          ✓ {userInfo.firstName} {userInfo.lastName}
                        </div>
                      )}
                      {userInfo.family
                        .filter((m) => m.alreadyRegistered)
                        .map((member) => (
                          <div key={member.id} className="text-sm text-green-700">
                            ✓ {member.firstName} {member.lastName}
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="mb-4 text-xl font-semibold text-gray-900">Cancel Registration</h3>
                <Card className="border-red-200">
                  <CardContent className="p-6">
                    <p className="mb-4 text-sm text-gray-600">
                      If you change your mind, you can always re-register later. Select which participants will no
                      longer be attending:
                    </p>

                    <div className="mb-6 space-y-3">
                      {userInfo.alreadyRegistered && (
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={`cancel-${userInfo.id}`}
                            checked={selectedAttendeesToCancel.includes(userInfo.id)}
                            onCheckedChange={(checked) => {
                              setSelectedAttendeesToCancel((prev) =>
                                checked ? [...prev, userInfo.id] : prev.filter((id) => id !== userInfo.id),
                              );
                            }}
                          />
                          <label
                            htmlFor={`cancel-${userInfo.id}`}
                            className="cursor-pointer text-sm font-medium text-gray-900"
                          >
                            {userInfo.firstName} {userInfo.lastName}
                          </label>
                        </div>
                      )}

                      {userInfo.family
                        .filter((m) => m.alreadyRegistered)
                        .map((member) => (
                          <div key={member.id} className="flex items-center space-x-3">
                            <Checkbox
                              id={`cancel-${member.id}`}
                              checked={selectedAttendeesToCancel.includes(member.id)}
                              onCheckedChange={(checked) => {
                                setSelectedAttendeesToCancel((prev) =>
                                  checked ? [...prev, member.id] : prev.filter((id) => id !== member.id),
                                );
                              }}
                            />
                            <label
                              htmlFor={`cancel-${member.id}`}
                              className="cursor-pointer text-sm font-medium text-gray-900"
                            >
                              {member.firstName} {member.lastName}
                            </label>
                          </div>
                        ))}
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedAttendeesToCancel([])}
                        disabled={selectedAttendeesToCancel.length === 0}
                        className="flex-1"
                      >
                        Clear Selection
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleCancelRegistration}
                        disabled={selectedAttendeesToCancel.length === 0}
                        className="flex-1"
                      >
                        Cancel Registration
                        {selectedAttendeesToCancel.length > 0 && ` (${selectedAttendeesToCancel.length})`}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {spotsLeft > 0 && (!userInfo.alreadyRegistered || userInfo.family.some((m) => !m.alreadyRegistered)) && (
                <div>
                  <h3 className="mb-4 text-xl font-semibold text-gray-900">Register Additional Family Members</h3>
                  <Card>
                    <CardContent className="p-6">
                      <div className="mb-6 space-y-3">
                        {!userInfo.alreadyRegistered && (
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              id={`add-${userInfo.id}`}
                              checked={selectedAttendeesToRegister.includes(userInfo.id)}
                              onCheckedChange={(checked) => {
                                setSelectedAttendeesToRegister((prev) =>
                                  checked ? [...prev, userInfo.id] : prev.filter((id) => id !== userInfo.id),
                                );
                              }}
                              disabled={
                                !selectedAttendeesToRegister.includes(userInfo.id) &&
                                selectedAttendeesToRegister.length >= spotsLeft
                              }
                            />
                            <label
                              htmlFor={`add-${userInfo.id}`}
                              className="cursor-pointer text-sm font-medium text-gray-900"
                            >
                              {userInfo.firstName} {userInfo.lastName}
                              {!selectedAttendeesToRegister.includes(userInfo.id) &&
                                selectedAttendeesToRegister.length >= spotsLeft && (
                                  <span className="ml-2 text-xs italic text-gray-500">(Capacity full)</span>
                                )}
                            </label>
                          </div>
                        )}

                        {userInfo.family
                          .filter((m) => !m.alreadyRegistered)
                          .map((member) => (
                            <div key={member.id} className="flex items-center space-x-3">
                              <Checkbox
                                id={`add-${member.id}`}
                                checked={selectedAttendeesToRegister.includes(member.id)}
                                onCheckedChange={(checked) => {
                                  setSelectedAttendeesToRegister((prev) =>
                                    checked ? [...prev, member.id] : prev.filter((id) => id !== member.id),
                                  );
                                }}
                                disabled={
                                  !selectedAttendeesToRegister.includes(member.id) &&
                                  selectedAttendeesToRegister.length >= spotsLeft
                                }
                              />
                              <label
                                htmlFor={`add-${member.id}`}
                                className="cursor-pointer text-sm font-medium text-gray-900"
                              >
                                {member.firstName} {member.lastName}
                                {!selectedAttendeesToRegister.includes(member.id) &&
                                  selectedAttendeesToRegister.length >= spotsLeft && (
                                    <span className="ml-2 text-xs italic text-gray-500">(Capacity full)</span>
                                  )}
                              </label>
                            </div>
                          ))}
                      </div>

                      <Button
                        className="w-full bg-green-700 text-white hover:bg-green-800"
                        onClick={handleRegister}
                        disabled={selectedAttendeesToRegister.length === 0}
                      >
                        Register Additional Members
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          ) : (
            <div>
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">Register for the Event</h2>
              {registerDisabled && (
                <p className="mb-4 text-red-500">{isFull ? "The event is full." : "Registration is closed."}</p>
              )}
              <Card>
                <CardContent className="p-6">
                  <h3 className="mb-3 text-lg font-medium text-gray-800">Who&apos;s attending?</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={userInfo.id}
                        checked={selectedAttendeesToRegister.includes(userInfo.id)}
                        onCheckedChange={(checked) => {
                          setSelectedAttendeesToRegister((prev) =>
                            checked ? [...prev, userInfo.id] : prev.filter((id) => id !== userInfo.id),
                          );
                        }}
                        disabled={
                          !selectedAttendeesToRegister.includes(userInfo.id) &&
                          selectedAttendeesToRegister.length >= spotsLeft
                        }
                      />
                      <label htmlFor={userInfo.id} className="cursor-pointer text-sm font-medium text-gray-900">
                        {userInfo.firstName} {userInfo.lastName}
                        {!selectedAttendeesToRegister.includes(userInfo.id) &&
                          selectedAttendeesToRegister.length >= spotsLeft && (
                            <span className="ml-2 text-xs italic text-gray-500">(Capacity full)</span>
                          )}
                      </label>
                    </div>
                    {userInfo.family.map((member) => (
                      <div key={member.id} className="flex items-center space-x-3">
                        <Checkbox
                          id={member.id}
                          checked={selectedAttendeesToRegister.includes(member.id)}
                          onCheckedChange={(checked) => {
                            setSelectedAttendeesToRegister((prev) =>
                              checked ? [...prev, member.id] : prev.filter((id) => id !== member.id),
                            );
                          }}
                          disabled={
                            !selectedAttendeesToRegister.includes(member.id) &&
                            selectedAttendeesToRegister.length >= spotsLeft
                          }
                        />
                        <label htmlFor={member.id} className="cursor-pointer text-sm font-medium text-gray-900">
                          {member.firstName} {member.lastName}
                          {!selectedAttendeesToRegister.includes(member.id) &&
                            selectedAttendeesToRegister.length >= spotsLeft && (
                              <span className="ml-2 text-xs italic text-gray-500">(Capacity full)</span>
                            )}
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 text-center">
                    {event.eventWaiverTemplates.length === 0 && event.fee > 0 ? (
                      <Button
                        size="lg"
                        className="bg-green-700 px-8 py-3 text-white hover:bg-green-800"
                        onClick={handlePayment}
                        disabled={registerDisabled || selectedAttendeesToRegister.length === 0}
                      >
                        Pay for Event
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        className="bg-green-700 px-8 py-3 text-white hover:bg-green-800"
                        onClick={handleRegister}
                        disabled={registerDisabled || selectedAttendeesToRegister.length === 0}
                      >
                        Register for Event
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-8 text-center">
          <p className="mb-4 text-gray-600">Please sign in to register for this event.</p>
          <SignInButton>
            <Button size="lg" className="bg-green-700 px-8 py-3 text-white hover:bg-green-800">
              Sign In to Register
            </Button>
          </SignInButton>
        </div>
      )}
    </div>
  );
}
