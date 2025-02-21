"use client";

import { useEffect, useState } from "react";
import EventCard from "@/components/EventComponent/EventCard";
import { useUser } from "@clerk/nextjs";
import { getEvents } from "@/app/actions/events/actions";

interface IEvent {
  _id: string;
  title: string;
  startDateTime: Date | null;
  endDateTime: Date | null;
  location: string;
  description: string;
  images: string[];
  registrationDeadline: Date | null;
  capacity: number;
  registeredUsers: string[];
}

export default function Home() {
  const [events, setEvents] = useState<IEvent[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<IEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { isLoaded, user } = useUser();

  useEffect(() => {
    async function fetchEvents() {
      try {
        if (!isLoaded || !user) return;

        // Fetch user details from MongoDB
        const userResponse = await fetch(`/api/users/${user.id}`);
        if (!userResponse.ok) throw new Error("Failed to fetch user data");

        const userData = await userResponse.json();
        console.log("MongoDB User Data:", userData);

        if (!userData || !userData._id) {
          console.warn("User not found in MongoDB");
          return;
        }

        const mongoUserId = userData._id; // This is the ObjectId

        // Fetch events
        const data = await getEvents();
        const formattedEvents: IEvent[] = data.map((event: any) => ({
          _id: event._id.toString(),
          title: event.title || "Untitled Event",
          startDateTime: event.startDate ? new Date(event.startDate) : null,
          endDateTime: event.endDate ? new Date(event.endDate) : null,
          location: event.location || "Location not available",
          description: event.description || "No description provided",
          images: Array.isArray(event.images) ? event.images : [],
          registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline) : null,
          capacity: event.capacity || 0,
          registeredUsers: event.registeredUsers ? event.registeredUsers.map((u: any) => u.toString()) : [],
        }));

        console.log("Formatted Events:", formattedEvents);

        // Filter events where registeredUsers includes the MongoDB user _id
        const userRegisteredEvents = formattedEvents.filter((event) =>
          event.registeredUsers.map((id) => id.toString()).includes(mongoUserId.toString()),
        );

        setEvents(formattedEvents);
        setRegisteredEvents(userRegisteredEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
        setError("Failed to load events. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [isLoaded, user]);

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
                eventTitle={event.title}
                startDateTime={event.startDateTime}
                endDateTime={event.endDateTime}
                location={event.location}
                description={event.description}
                images={event.images}
                registrationDeadline={event.registrationDeadline}
                capacity={event.capacity}
                currentRegistrations={event.registeredUsers.length}
              />
            ))}
          </div>
        </section>
      )}

      <h2 className="mb-4 text-xl font-semibold">All Events</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard
            key={event._id}
            id={event._id}
            eventTitle={event.title}
            startDateTime={event.startDateTime}
            endDateTime={event.endDateTime}
            location={event.location}
            description={event.description}
            images={event.images}
            registrationDeadline={event.registrationDeadline}
            capacity={event.capacity}
            currentRegistrations={event.registeredUsers.length}
          />
        ))}
      </div>
    </main>
  );
}
