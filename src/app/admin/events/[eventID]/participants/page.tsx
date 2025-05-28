"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Phone, Calendar, Trash2 } from "lucide-react";
import LoadingSkeleton from "@/components/Forms/LoadingSkeleton";

interface RegisteredUser {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumbers?: string[];
  };
  registrationDate: string;
}

interface RegisteredChild {
  childId: string;
  parent: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumbers?: string[];
  };
  child: {
    _id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
  };
  registrationDate: string;
}

interface ParticipantsData {
  eventId: string;
  eventTitle: string;
  registeredUsers: RegisteredUser[];
  registeredChildren: RegisteredChild[];
  totalParticipants: number;
  capacity: number;
}

interface EventData {
  title: string;
  startDate: string;
  location: string;
  capacity: number;
}

const EventParticipantsPage = () => {
  const router = useRouter();
  const { eventID } = useParams();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [participantsData, setParticipantsData] = useState<ParticipantsData | null>(null);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (!eventID || Array.isArray(eventID)) return;

    const fetchData = async () => {
      try {
        // Fetch event details and participants
        const [eventRes, participantsRes] = await Promise.all([
          fetch(`/api/events/${eventID}`),
          fetch(`/api/events/${eventID}/participants`),
        ]);

        if (!eventRes.ok) {
          throw new Error("Failed to fetch event details");
        }

        const event = await eventRes.json();
        setEventData(event);

        if (participantsRes.ok) {
          const participantsData = await participantsRes.json();
          console.log("Participants data:", participantsData);
          setParticipantsData(participantsData);
        } else {
          throw new Error("Failed to fetch participants");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load participants data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventID, toast]);

  const handleBack = () => {
    router.push("/admin/events");
  };

  const handleRemoveParticipant = async (participantId: string, isChild: boolean) => {
    if (!confirm(`Are you sure you want to remove this ${isChild ? "child" : "participant"}?`)) {
      return;
    }

    setRemoving(participantId);
    try {
      const res = await fetch(`/api/events/${eventID}/participants`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, isChild }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to remove participant");
      }

      toast({
        title: "Success",
        description: `${isChild ? "Child" : "Participant"} removed successfully`,
        variant: "default",
      });

      // Refresh the data
      window.location.reload();
    } catch (error: any) {
      console.error("Error removing participant:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove participant",
        variant: "destructive",
      });
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  const totalParticipants = participantsData?.totalParticipants || 0;
  const capacity = eventData?.capacity || participantsData?.capacity || 0;
  const fillPercentage = capacity > 0 ? Math.round((totalParticipants / capacity) * 100) : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Event Participants</h1>
            {eventData && (
              <p className="mt-1 text-gray-600">
                {eventData.title} • {new Date(eventData.startDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Event Summary Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Event Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-medium">{eventData?.location}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Capacity</p>
                <p className="font-medium">{capacity} spots</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Registered</p>
                <p className="font-medium">
                  {totalParticipants} / {capacity}
                  <span className="ml-2 text-sm text-gray-500">({fillPercentage}% full)</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Participants List */}
        <Card>
          <CardHeader>
            <CardTitle>Participants ({totalParticipants})</CardTitle>
          </CardHeader>
          <CardContent>
            {totalParticipants === 0 ? (
              <div className="py-8 text-center">
                <p className="mb-4 text-gray-500">No participants registered yet</p>
                <p className="text-sm text-gray-400">Participants will appear here once they register for the event</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Adult Participants */}
                {participantsData?.registeredUsers?.map((participant) => (
                  <div key={participant.user._id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <h3 className="font-medium">
                          {participant.user.firstName} {participant.user.lastName}
                        </h3>
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-600">
                          Adult
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {participant.user.email}
                        </div>
                        {participant.user.phoneNumbers?.[0] && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {participant.user.phoneNumbers[0]}
                          </div>
                        )}
                        <div>Registered: {new Date(participant.registrationDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveParticipant(participant.user._id, false)}
                      disabled={removing === participant.user._id}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      {removing === participant.user._id ? (
                        "Removing..."
                      ) : (
                        <>
                          <Trash2 className="mr-1 h-4 w-4" />
                          Remove
                        </>
                      )}
                    </Button>
                  </div>
                ))}

                {/* Child Participants */}
                {participantsData?.registeredChildren?.map((child) => (
                  <div key={child.childId} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <h3 className="font-medium">
                          {child.child?.firstName} {child.child?.lastName}
                        </h3>
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-600">
                          Child
                        </span>
                        {child.child?.dateOfBirth && (
                          <span className="text-xs text-gray-500">
                            Age:{" "}
                            {Math.floor(
                              (new Date().getTime() - new Date(child.child.dateOfBirth).getTime()) /
                                (365.25 * 24 * 60 * 60 * 1000),
                            )}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {child.parent.email} (Parent: {child.parent.firstName} {child.parent.lastName})
                        </div>
                        {child.parent.phoneNumbers?.[0] && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {child.parent.phoneNumbers[0]}
                          </div>
                        )}
                        <div>Registered: {new Date(child.registrationDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveParticipant(child.childId, true)}
                      disabled={removing === child.childId}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      {removing === child.childId ? (
                        "Removing..."
                      ) : (
                        <>
                          <Trash2 className="mr-1 h-4 w-4" />
                          Remove
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EventParticipantsPage;
