"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getEvents } from "../actions/events/actions";
import EventCard from "@/components/EventComponent/EventCard";

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

export default function AdminPage() {
  const [events, setEvents] = useState<IEvent[]>([]);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const data = await getEvents();

        // Transform MongoDB objects into `IEvent` format
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
          registeredUsers: event.registeredUsers ? event.registeredUsers.map((user: any) => user.toString()) : [],
        }));

        setEvents(formattedEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    }

    fetchEvents();
  }, []);

  return (
    <div>
      <h1>All Events</h1>
      <Link href="/admin/create">
        <button className="rounded-md bg-blue-500 px-4 py-2 text-white">Create Event</button>
      </Link>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
    </div>
  );
}
