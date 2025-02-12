"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getEvents } from "../actions/events/actions";
import EventCard from "@/components/EventComponent/EventCard";

interface IEvent {
  _id: string;
  title: string;
  startDate: string;
}

export default function AdminPage() {
  const [events, setEvents] = useState<IEvent[]>([]);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const data = await getEvents();
        setEvents(data as unknown as IEvent[]);
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
            title={event.title}
            date={new Date(event.startDate).toLocaleDateString()}
            time={new Date(event.startDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          />
        ))}
      </div>
    </div>
  );
}
