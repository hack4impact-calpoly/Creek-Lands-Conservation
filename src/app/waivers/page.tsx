"use client";

import { useEffect, useState } from "react";
import WaiverSignatureComponent from "@/components/WaiverSignatureComponent/WaiverSignatureComponent";
import { Card } from "@/components/ui/card";
import { useUser } from "@clerk/nextjs";
import { getEvents } from "@/app/actions/events/actions";
import { EventInfo } from "@/types/events";
import { formatEvents } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface RegisteredEvent {
  id: string;
  eventName: string;
  eventDate: Date;
  eventTime: string;
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

        // Fetch all events and user data
        const events = await getEvents();
        const formattedEvents = formatEvents(events);

        const userResponse = await fetch(`/api/users/${user.id}`);
        if (!userResponse.ok) throw new Error("Failed to fetch user data");

        const userData = await userResponse.json();
        if (!userData?._id) throw new Error("User not Found in MongoDB");

        // Filter for registered events and transform to match RegisteredEvent interface
        const userRegisteredEvents = formattedEvents
          .filter((event) => event.registeredUsers.includes(userData._id.toString()))
          .filter((event) => event.startDateTime !== null)
          .map((event) => ({
            id: event.id,
            eventName: event.title,
            eventDate: event.startDateTime ? new Date(event.startDateTime) : new Date(),
            eventTime: event.startDateTime ? new Date(event.startDateTime).toLocaleTimeString() : "",
            signatureDate: event.startDateTime ? new Date(event.startDateTime) : new Date(),
            waiverId: event.id, //just the event id for now replace with actual waiverId
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
      // TODO: Implement waiver viewing functionality
      // This could open a modal, navigate to a new page, or fetch and display a PDF
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
          <Card className="p-6 text-center text-gray-500">No signed waivers found</Card>
        ) : (
          registeredEvents.map((event) => (
            <div key={event.id} className="flex items-center justify-between bg-gray-200 p-4">
              <div className="flex-1">
                <h2 className="text-xl font-medium">{event.eventName}</h2>
              </div>

              <div className="flex-1">
                <p>Saturday {new Date(event.eventDate).toLocaleDateString()}</p>
              </div>

              <div className="flex-1">
                <p>{event.eventTime}</p>
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-green-200 px-4 py-2">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Signed {new Date(event.signatureDate).toLocaleDateString()}</span>
              </div>

              <button
                onClick={() => handleViewWaiver(event.waiverId)}
                className="ml-4 rounded-lg bg-gray-400 px-4 py-2 text-black transition-colors hover:bg-gray-500"
              >
                Click here to View Waiver
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
