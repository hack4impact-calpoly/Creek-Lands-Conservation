"use client";

import { useEffect, useState } from "react";
import { getEvents } from "@/app/actions/events/actions";
import { LimitedEventInfo } from "@/types/events";
import EventSection from "@/components/EventComponent/EventSection";
import SkeletonEventSection from "@/components/EventComponent/EventSectionSkeleton";
import Link from "next/link";

export default function AdminPage() {
  const [eventSections, setEventSections] = useState<{
    unpublished: LimitedEventInfo[];
    active: LimitedEventInfo[];
    upcoming: LimitedEventInfo[];
    past: LimitedEventInfo[];
  }>({ unpublished: [], active: [], upcoming: [], past: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAndProcessEvents = async () => {
    try {
      const events = await getEvents();
      const categorized = categorizeEvents(events);
      setEventSections(categorized);
      setIsLoading(false);
    } catch (error: any) {
      setError(error.message || "Failed to load events");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAndProcessEvents();
    const interval = setInterval(() => {
      fetchAndProcessEvents();
    }, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const handleDeleteEvent = (eventId: string) => {
    setEventSections((prev) => ({
      unpublished: prev.unpublished.filter((event) => event.id !== eventId),
      active: prev.active.filter((event) => event.id !== eventId),
      upcoming: prev.upcoming.filter((event) => event.id !== eventId),
      past: prev.past.filter((event) => event.id !== eventId),
    }));
  };

  if (isLoading) {
    return (
      <main className="mx-auto mb-8 flex flex-col">
        <SkeletonEventSection title="Unpublished Events" />
        <SkeletonEventSection title="Active Events" />
        <SkeletonEventSection title="Upcoming Events" />
        <SkeletonEventSection title="Past Events" />
      </main>
    );
  }

  if (error) return <p>{error}</p>;

  return (
    <main className="mx-auto mb-8 flex flex-col">
      <EventSection title="Unpublished Events" events={eventSections.unpublished} onDelete={handleDeleteEvent}>
        <Link href="/admin/events/create">
          <button className="rounded-md bg-[#558552] px-4 py-2 text-white hover:bg-[#488644]">Create Event</button>
        </Link>
      </EventSection>
      <EventSection title="Active Events" events={eventSections.active} onDelete={handleDeleteEvent} />
      <EventSection title="Upcoming Events" events={eventSections.upcoming} onDelete={handleDeleteEvent} />
      <EventSection title="Past Events" events={eventSections.past} onDelete={handleDeleteEvent} />
    </main>
  );
}

const categorizeEvents = (events: LimitedEventInfo[]) => {
  const now = new Date();
  const sections = {
    unpublished: [] as LimitedEventInfo[],
    active: [] as LimitedEventInfo[],
    upcoming: [] as LimitedEventInfo[],
    past: [] as LimitedEventInfo[],
  };

  events.forEach((event) => {
    // Handle draft events first
    if (event.isDraft) {
      sections.unpublished.push(event);
      return;
    }

    // Parse dates
    const startDate = event.startDate ? new Date(event.startDate) : null;
    const endDate = event.endDate ? new Date(event.endDate) : null;

    // Validate dates
    if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      if (startDate <= now && endDate >= now) {
        sections.active.push(event);
      } else if (startDate > now) {
        sections.upcoming.push(event);
      } else {
        sections.past.push(event);
      }
    } else if (startDate && !isNaN(startDate.getTime()) && startDate > now) {
      sections.upcoming.push(event);
    } else {
      sections.past.push(event); // Default to past for invalid/missing dates
    }
  });

  return sections;
};
