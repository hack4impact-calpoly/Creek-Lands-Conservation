"use client";

import { useEffect, useState } from "react";
import { getEvents } from "@/app/actions/events/actions";
import { EventInfo } from "@/types/events";
import EventSection from "@/components/EventComponent/EventSection";
import SkeletonEventSection from "@/components/EventComponent/EventSectionSkeleton";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatEvents } from "@/lib/utils";

export default function AdminPage() {
  const [futureEvents, setFutureEvents] = useState<EventInfo[]>([]);
  const [ongoingEvents, setOngoingEvents] = useState<EventInfo[]>([]);
  const [pastEvents, setPastEvents] = useState<EventInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAndProcessEvents = async () => {
    try {
      const events = await getEvents();
      const formattedEvents = formatEvents(events);
      const { future, ongoing, past } = categorizeEvents(formattedEvents);

      setFutureEvents(future);
      setOngoingEvents(ongoing);
      setPastEvents(past);
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
    setFutureEvents((prev) => prev.filter((event) => event.id !== eventId));
    setOngoingEvents((prev) => prev.filter((event) => event.id !== eventId));
    setPastEvents((prev) => prev.filter((event) => event.id !== eventId));
  };

  if (isLoading)
    return (
      <main className="mx-auto mb-8 flex flex-col">
        <SkeletonEventSection title="Future Events" />
        <SkeletonEventSection title="Ongoing Events" />
        <SkeletonEventSection title="Past Events" />
      </main>
    );

  if (error) return <p>{error}</p>;

  return (
    <main className="mx-auto mb-8 flex flex-col">
      <div className="mb-6 flex justify-end">
        <Link href="/admin/events/create">
          <button className="rounded-md bg-[#558552] px-4 py-2 text-white hover:bg-[#488644]">Create Event</button>
        </Link>
      </div>

      {/* Tabs for event categories */}
      <Tabs defaultValue="future" className="w-full">
        <TabsList className="border-white-300 flex space-x-4 border-b pb-2">
          <TabsTrigger value="future">Future Events</TabsTrigger>
          <TabsTrigger value="ongoing">Ongoing Events</TabsTrigger>
          <TabsTrigger value="past">Past Events</TabsTrigger>
        </TabsList>

        <TabsContent value="future">
          <EventSection title="Future Events" events={futureEvents} onDelete={handleDeleteEvent} />
        </TabsContent>
        <TabsContent value="ongoing">
          <EventSection title="Ongoing Events" events={ongoingEvents} onDelete={handleDeleteEvent} />
        </TabsContent>
        <TabsContent value="past">
          <EventSection title="Past Events" events={pastEvents} onDelete={handleDeleteEvent} />
        </TabsContent>
      </Tabs>
    </main>
  );
}

/**
 * Categorizes events into Future, Ongoing, and Past.
 */
const categorizeEvents = (events: EventInfo[]) => {
  const now = new Date();
  const categorized = { future: [], ongoing: [], past: [] } as {
    future: EventInfo[];
    ongoing: EventInfo[];
    past: EventInfo[];
  };

  events.forEach((event) => {
    const startDate = event.startDateTime ? new Date(event.startDateTime) : null;
    const endDate = event.endDateTime ? new Date(event.endDateTime) : null;

    if (startDate && endDate) {
      if (startDate > now) {
        categorized.future.push(event);
      } else if (startDate <= now && endDate >= now) {
        categorized.ongoing.push(event);
      } else {
        categorized.past.push(event);
      }
    } else if (startDate && startDate > now) {
      categorized.future.push(event);
    } else {
      categorized.past.push(event);
    }
  });

  return categorized;
};
