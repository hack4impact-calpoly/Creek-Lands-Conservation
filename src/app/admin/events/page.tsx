"use client";

import { useEffect, useState } from "react";
import { getEvents } from "@/app/actions/events/actions";
import { EventInfo } from "@/types/events";
import EventSection from "@/components/EventComponent/EventSection";
import SkeletonEventSection from "@/components/EventComponent/EventSectionSkeleton";
import Link from "next/link";
import { formatEvents } from "@/lib/utils";

export default function AdminPage() {
  const [eventSections, setEventSections] = useState<{
    active: EventInfo[];
    upcoming: EventInfo[];
    past: EventInfo[];
  }>({ active: [], upcoming: [], past: [] });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAndProcessEvents = async () => {
    try {
      const events = await getEvents();
      const formattedEvents = formatEvents(events);
      const categorized = categorizeEvents(formattedEvents);

      setEventSections(categorized);
      setIsLoading(false);
    } catch (error: any) {
      setError(error.message || "Failed to load events");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAndProcessEvents();

    // Refresh events every 5 minutes
    const interval = setInterval(() => {
      fetchAndProcessEvents();
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  const handleDeleteEvent = (eventId: string) => {
    setEventSections((prev) => ({
      active: prev.active.filter((event) => event.id !== eventId),
      upcoming: prev.active.filter((event) => event.id !== eventId),
      past: prev.past.filter((event) => event.id !== eventId),
    }));
  };

  if (isLoading)
    return (
      <main className="mx-auto mb-8 flex flex-col">
        <SkeletonEventSection title="Active Events" />
        <SkeletonEventSection title="Upcoming Events" />
        <SkeletonEventSection title="Past Events" />
      </main>
    );

  if (error) return <p>{error}</p>;

  return (
    <main className="mx-auto mb-8 flex flex-col">
      <EventSection title="Active Events" events={eventSections.active} onDelete={handleDeleteEvent}>
        <Link href="/admin/events/create">
          <button className="rounded-md bg-blue-500 px-4 py-2 text-white">Create Event</button>
        </Link>
      </EventSection>
      <EventSection title="Upcoming Events" events={eventSections.upcoming} onDelete={handleDeleteEvent} />
      <EventSection title="Past Events" events={eventSections.past} onDelete={handleDeleteEvent} />
    </main>
  );
}

const categorizeEvents = (events: EventInfo[]) => {
  const now = new Date();
  const sections = { active: [], upcoming: [], past: [] } as {
    active: EventInfo[];
    upcoming: EventInfo[];
    past: EventInfo[];
  };

  events.forEach((event) => {
    if (event.startDateTime && event.endDateTime) {
      if (event.startDateTime <= now && event.endDateTime >= now) {
        sections.active.push(event);
      } else if (event.startDateTime > now) {
        sections.upcoming.push(event);
      } else {
        sections.past.push(event);
      }
    } else if (event.startDateTime && event.startDateTime > now) {
      sections.upcoming.push(event);
    } else {
      sections.past.push(event);
    }
  });

  return sections;
};
