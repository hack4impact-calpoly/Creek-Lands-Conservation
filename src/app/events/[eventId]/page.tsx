"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, SignInButton } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Mail, CalendarClock, Users, Text, AlertCircle, ArrowLeft } from "lucide-react";
import Image from "next/image";
import DOMPurify from "dompurify";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getEventById } from "@/app/actions/events/actions";
import { LimitedEventInfo } from "@/types/events";

export default function EventPage({ params }: { params: { eventId: string } }) {
  const { eventId } = params;
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const { toast } = useToast();
  const [event, setEvent] = useState<LimitedEventInfo | null>(null);
  const [userInfo, setUserInfo] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    alreadyRegistered: boolean;
    family: { id: string; firstName: string; lastName: string; alreadyRegistered: boolean }[];
  } | null>(null);
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const eventData = await getEventById(eventId);
        console.log("Fetched event data:", eventData);
        if (!eventData) {
          throw new Error("Event not found");
        }
        setEvent(eventData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchUserFamily = async () => {
      if (!isSignedIn || !user?.id) return;

      try {
        const response = await fetch(`/api/users/${user.id}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to fetch user data");
        }
        const userData = await response.json();
        setUserInfo({
          id: userData._id,
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          alreadyRegistered: userData.registeredEvents.includes(eventId),
          family:
            userData.children?.map((child: any) => ({
              id: child._id,
              firstName: child.firstName || "",
              lastName: child.lastName || "",
              alreadyRegistered: child.registeredEvents.includes(eventId),
            })) || [],
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        toast({
          title: "Error",
          description: "Failed to load family information",
          variant: "destructive",
        });
      }
    };

    fetchEvent();
    fetchUserFamily();
  }, [eventId, isSignedIn, user, toast]);

  const handleRegister = async () => {
    if (!selectedAttendees.length) {
      toast({
        title: "No Attendees Selected",
        description: "Please select at least one attendee.",
        variant: "destructive",
      });
      return;
    }

    const participants = [
      ...(selectedAttendees.includes(userInfo!.id)
        ? [
            {
              firstName: userInfo!.firstName,
              lastName: userInfo!.lastName,
              userID: userInfo!.id,
              isChild: false,
            },
          ]
        : []),
      ...userInfo!.family
        .filter((m) => selectedAttendees.includes(m.id))
        .map((m) => ({
          firstName: m.firstName,
          lastName: m.lastName,
          userID: m.id,
          isChild: true,
        })),
    ];

    if (event!.eventWaiverTemplates?.length > 0) {
      localStorage.setItem("waiverParticipants", JSON.stringify(participants));
      router.push(`/events/${eventId}/sign`);
    } else {
      try {
        const response = await fetch(`/api/events/${eventId}/registrations`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attendees: selectedAttendees }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to register.");
        toast({ title: "Success", description: "Registered successfully." });
        setUserInfo((prev) =>
          prev
            ? {
                ...prev,
                alreadyRegistered: selectedAttendees.includes(prev.id) ? true : prev.alreadyRegistered,
                family: prev.family.map((member) => ({
                  ...member,
                  alreadyRegistered: selectedAttendees.includes(member.id) ? true : member.alreadyRegistered,
                })),
              }
            : null,
        );
        setEvent((prev) =>
          prev
            ? {
                ...prev,
                currentRegistrations: prev.currentRegistrations + selectedAttendees.length,
              }
            : null,
        );
        router.push("/");
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to register for the event.",
          variant: "destructive",
        });
      }
    }
  };

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
        <p className="mb-6 text-gray-600">{error || "The event you`&apos;`re looking for doesn`&apos;`t exist."}</p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  const hasRegistrationClosed = event.registrationDeadline ? new Date() > new Date(event.registrationDeadline) : false;
  const isFull = event.capacity && (event.currentRegistrations ?? 0) >= event.capacity;
  const spotsLeft = event.capacity ? event.capacity - (event.currentRegistrations ?? 0) : 0;
  const isAlmostFull = spotsLeft <= 5 && spotsLeft > 0;
  const canRegister = !isFull && !hasRegistrationClosed;

  const eventImages =
    event.images?.length > 0
      ? event.images
      : [
          "https://creeklands.org/wp-content/uploads/2023/10/creek-lands-conservation-conservation-science-education-central-coast-yes-v1.jpg",
        ];

  const sanitizedDescription = DOMPurify.sanitize(event.description || "");

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Events
      </Button>

      {/* Event Header */}
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

      {/* Event Images */}
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

      {/* Event Details Grid */}
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
              <p className="font-semibold text-gray-900">{"marysia@creeklands.org"}</p>
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
                  {event.currentRegistrations ?? 0} / {event.capacity}
                </p>
                <div className="h-2 min-w-[60px] flex-1 rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-green-600 transition-all duration-300"
                    style={{ width: `${Math.min(((event.currentRegistrations ?? 0) / event.capacity) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
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

      {/* Registration Section */}
      {isSignedIn && userInfo ? (
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">Register for the Event</h2>
          {!canRegister && (
            <p className="mb-4 text-red-500">{isFull ? "The event is full." : "Registration is closed."}</p>
          )}
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-3 text-lg font-medium text-gray-800">Who`&apos;`s attending?</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={userInfo.id}
                    checked={selectedAttendees.includes(userInfo.id) || userInfo.alreadyRegistered}
                    onCheckedChange={(checked) => {
                      setSelectedAttendees((prev) =>
                        checked ? [...prev, userInfo.id] : prev.filter((id) => id !== userInfo.id),
                      );
                    }}
                    disabled={
                      userInfo.alreadyRegistered ||
                      (!selectedAttendees.includes(userInfo.id) && selectedAttendees.length >= spotsLeft)
                    }
                  />
                  <label
                    htmlFor={userInfo.id}
                    className="text-sm font-medium text-gray-900 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {userInfo.firstName} {userInfo.lastName}
                    {(userInfo.alreadyRegistered ||
                      (!selectedAttendees.includes(userInfo.id) && selectedAttendees.length >= spotsLeft)) && (
                      <span className="ml-2 text-xs italic text-gray-500">
                        {userInfo.alreadyRegistered ? "(Already registered)" : "(Capacity full)"}
                      </span>
                    )}
                  </label>
                </div>
                {userInfo.family.map((member) => (
                  <div key={member.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={member.id}
                      checked={selectedAttendees.includes(member.id) || member.alreadyRegistered}
                      onCheckedChange={(checked) => {
                        setSelectedAttendees((prev) =>
                          checked ? [...prev, member.id] : prev.filter((id) => id !== member.id),
                        );
                      }}
                      disabled={
                        member.alreadyRegistered ||
                        (!selectedAttendees.includes(member.id) && selectedAttendees.length >= spotsLeft)
                      }
                    />
                    <label
                      htmlFor={member.id}
                      className="text-sm font-medium text-gray-900 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {member.firstName} {member.lastName}
                      {(member.alreadyRegistered ||
                        (!selectedAttendees.includes(member.id) && selectedAttendees.length >= spotsLeft)) && (
                        <span className="ml-2 text-xs italic text-gray-500">
                          {member.alreadyRegistered ? "(Already registered)" : "(Capacity full)"}
                        </span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-center">
                <Button
                  size="lg"
                  className="bg-green-700 px-8 py-3 text-white hover:bg-green-800"
                  onClick={handleRegister}
                  disabled={
                    !canRegister ||
                    selectedAttendees.length === 0 ||
                    (userInfo.alreadyRegistered && userInfo.family.every((m) => m.alreadyRegistered))
                  }
                >
                  {userInfo.alreadyRegistered && userInfo.family.every((m) => m.alreadyRegistered)
                    ? "All Family Members Registered"
                    : "Register for Event"}
                </Button>
              </div>
            </CardContent>
          </Card>
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
