"use client";

import { useEffect, useState } from "react";
import EventCard from "@/components/EventComponent/EventCard";
import { useUser } from "@clerk/nextjs";
import { getEvents } from "@/app/actions/events/actions";

interface IEvent {
  id: string;
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
  const [allEvents, setAllEvents] = useState<IEvent[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<IEvent[]>([]);
  const [userPastEvents, setUserPastEvents] = useState<IEvent[]>([]);
  const [isloading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { isLoaded, user } = useUser();

  useEffect(() => {
    async function fetchEvents() {
      try {
        // TODO if not logged in still show all events
        if (!isLoaded || !user) return;

        // Fetch user details from MongoDB
        const userResponse = await fetch(`/api/users/${user.id}`);
        if (!userResponse.ok) throw new Error("Failed to fetch user data");

        const userData = await userResponse.json();

        if (!userData || !userData._id) throw new Error("User not Found in MongoDB");

        const mongoUserId = userData._id; // This is the ObjectId

        // Fetch events
        const data = await getEvents();
        const formattedEvents: IEvent[] = data.map((event: any) => ({
          id: event._id.toString(),
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

        const now = new Date();
        const registered: IEvent[] = [];
        const unregistered: IEvent[] = [];
        const past: IEvent[] = [];

        formattedEvents.forEach((event) => {
          // all inside one loop instead of having three filters
          // TODO consider other cases (children registered, upcoming, missed deadline, etc)
          if (event.registeredUsers.includes(mongoUserId.toString())) {
            if (event.endDateTime && event.endDateTime < now) {
              past.push(event);
            } else {
              registered.push(event);
            }
          } else {
            unregistered.push(event);
          }
        });
        setAllEvents(unregistered);
        setRegisteredEvents(registered);
        setUserPastEvents(past);
      } catch (error: any) {
        console.error("Error fetching events:", error);
        setError(error.message || "Failed to load events. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchEvents();
  }, [isLoaded, user]);

  if (isloading) return <p>Loading events...</p>;
  if (error) return <p>{error}</p>;

  return (
    <main className="p-4">
      {/* Placeholder Navbar */}

      <div>
        <nav className="mb-6 flex justify-between bg-gray-100 p-4 shadow-md">
          <div className="text-lg font-bold">Logo Placeholder</div>
          <div className="text-sm">Navigation Placeholder</div>
        </nav>
      </div>

      <section>
        <h1 className="mb-4 text-2xl font-bold">Registered Events</h1>
        <EventGrid events={registeredEvents} />
        {/* TODO conditionally render view more button*/}
      </section>

      {/* TODO improve spacing between sections */}
      <section>
        <h2 className="mb-4 text-2xl font-bold">All Events</h2>
        <EventGrid events={allEvents} />
        <button className="mt-4 rounded bg-gray-300 px-4 py-2">View More</button>
        {/* center the view more button */}
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">My Past Events</h2>
        <EventGrid events={userPastEvents} />
        <button className="mt-4 rounded bg-gray-300 px-4 py-2">View More</button>
      </section>
    </main>
  );
}

function EventGrid({ events }: { events: IEvent[] }) {
  // TODO from 1-4 column depending on screen space. Max two rows.
  // TODO view more button expands remaining rows
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventCard
          key={event.id}
          id={event.id}
          eventTitle={event.title}
          startDateTime={event.startDateTime}
          endDateTime={event.endDateTime}
          location={event.location}
          description={event.description}
          images={event.images}
          registrationDeadline={event.registrationDeadline}
          capacity={event.capacity}
          currentRegistrations={event.registeredUsers.length}
          userRegistered={true}
        />
      ))}
    </div>
  );
}

{
  /* <h1 className="mb-4 text-2xl font-bold">Upcoming Events</h1>
      {isLoaded && user && registeredEvents.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold">Your Registered Events</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {registeredEvents.map((event) => (
              <EventCard
                key={event.id}
                id={event.id}
                eventTitle={event.title}
                startDateTime={event.startDateTime}
                endDateTime={event.endDateTime}
                location={event.location}
                description={event.description}
                images={event.images}
                registrationDeadline={event.registrationDeadline}
                capacity={event.capacity}
                currentRegistrations={event.registeredUsers.length}
                userRegistered={true}
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
            userRegistered={false}
          />
        ))}
      </div> */
}
