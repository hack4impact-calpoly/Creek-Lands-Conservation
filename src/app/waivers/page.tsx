"use client";

import { useEffect, useState } from "react";
import WaiverSignatureComponent from "@/components/WaiverSignatureComponent/WaiverSignatureComponent";
import { useUser } from "@clerk/nextjs";
import { getEvents } from "@/app/actions/events/actions";
import { formatEvents } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface RegisteredEvent {
  id: string;
  eventName: string;
  startDateTime: Date;
  endDateTime: Date;
  signatureDate: Date;
  waiverId: string;
}

export default function WaiversPage() {
  const [registeredEvents, setRegisteredEvents] = useState<RegisteredEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isLoaded, user } = useUser();

  useEffect(() => {
    const fetchRegisteredEvents = async () => {
      try {
        if (!isLoaded || !user) return;

        const events = await getEvents();
        const formattedEvents = formatEvents(events);

        const userResponse = await fetch(`/api/users/${user.id}`);
        if (!userResponse.ok) throw new Error("Failed to fetch user data");

        const userData = await userResponse.json();
        if (!userData?._id) throw new Error("User not Found in MongoDB");

        const userRegisteredEvents = formattedEvents
          .filter((event) => event.registeredUsers.includes(userData._id.toString()))
          .filter((event) => event.startDateTime !== null)
          .map((event) => ({
            id: event.id,
            eventName: event.title,
            startDateTime: event.startDateTime ? new Date(event.startDateTime) : new Date(),
            endDateTime: event.endDateTime ? new Date(event.endDateTime) : new Date(),
            signatureDate: event.startDateTime ? new Date(event.startDateTime) : new Date(),
            waiverId: event.id,
          }));

        setRegisteredEvents(userRegisteredEvents);
      } catch (error: any) {
        console.error("Failed to fetch registered events:", error);
        setError(error.message || "Failed to load waivers");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRegisteredEvents();
  }, [isLoaded, user]);

  const handleViewWaiver = async (waiverId: string) => {
    try {
      window.open(`/api/waivers/${waiverId}`, "_blank");
    } catch (error) {
      console.error("Failed to view waiver:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) return <p>{error}</p>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-4xl">Past Signed Waivers</h1>

      <div className="flex flex-col gap-4">
        {registeredEvents.length === 0 ? (
          <div className="rounded-lg bg-gray-100 p-6 text-center text-gray-500">No signed waivers found</div>
        ) : (
          registeredEvents.map((event) => (
            <WaiverSignatureComponent
              key={event.id}
              eventName={event.eventName}
              startDateTime={event.startDateTime}
              endDateTime={event.endDateTime}
              signed={true} // All waivers are signed
              signatureDate={event.signatureDate}
              onViewWaiver={() => handleViewWaiver(event.waiverId)}
            />
          ))
        )}
      </div>
    </div>
  );
}
