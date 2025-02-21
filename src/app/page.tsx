"use client";

import { useEffect, useState } from "react";
import EventCard from "@/components/EventComponent/EventCard";
import { EventInfoPreview } from "@/components/EventComponent/EventInfoPreview";
import { useUser } from "@clerk/nextjs"; // Clerk authentication

type EventType = {
  _id: string;
  eventTitle: string;
  description: string;
  startDateTime: string;
  endDateTime?: string;
  location: string;
  fee?: number;
  images: string[];
  registrationDeadline?: string;
  capacity: number;
  currentRegistrations: number;
};

export default function Home() {
  const [events, setEvents] = useState<EventType[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<EventType[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoaded } = useUser(); // Get logged-in user info

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/events");
        const allEventsRaw = await res.json();
        console.log("Fetched Events:", allEventsRaw); // Log events to check data

        if (Array.isArray(allEventsRaw)) {
          setEvents(allEventsRaw);
        }

        if (user?.id) {
          const registeredRes = await fetch(`/api/user-registered-events?userId=${user.id}`);
          const userRegisteredEventsRaw = await registeredRes.json();
          setRegisteredEvents(userRegisteredEventsRaw);
        }
      } catch (err) {
        setError("Failed to load events.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user?.id]);

  if (loading) return <p>Loading events...</p>;
  if (error) return <p>{error}</p>;

  return (
    <main className="p-4">
      <h1 className="mb-4 text-2xl font-bold">Upcoming Events</h1>

      {isLoaded && user && registeredEvents.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold">Your Registered Events</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {registeredEvents.map((event) => (
              <EventCard
                key={event._id}
                id={event._id}
                eventTitle={event.eventTitle}
                startDateTime={new Date(event.startDateTime)}
                endDateTime={event.endDateTime ? new Date(event.endDateTime) : null}
                location={event.location}
                description={event.description}
                images={event.images}
                registrationDeadline={event.registrationDeadline ? new Date(event.registrationDeadline) : null}
                capacity={event.capacity}
                currentRegistrations={event.currentRegistrations}
                onClick={() => setSelectedEvent(event)}
              />
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard
            key={event._id}
            id={event._id}
            eventTitle={event.eventTitle}
            startDateTime={new Date(event.startDateTime)}
            endDateTime={event.endDateTime ? new Date(event.endDateTime) : null}
            location={event.location}
            description={event.description}
            images={event.images}
            registrationDeadline={event.registrationDeadline ? new Date(event.registrationDeadline) : null}
            capacity={event.capacity}
            currentRegistrations={event.currentRegistrations}
            onClick={() => setSelectedEvent(event)}
          />
        ))}
      </div>

      {selectedEvent && (
        <EventInfoPreview
          id={selectedEvent._id}
          title={selectedEvent.eventTitle}
          startDateTime={new Date(selectedEvent.startDateTime)}
          endDateTime={selectedEvent.endDateTime ? new Date(selectedEvent.endDateTime) : null}
          location={selectedEvent.location}
          description={selectedEvent.description}
          images={selectedEvent.images}
          registrationDeadline={
            selectedEvent.registrationDeadline ? new Date(selectedEvent.registrationDeadline) : null
          }
          capacity={selectedEvent.capacity}
          currentRegistrations={selectedEvent.currentRegistrations}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </main>
  );
}
