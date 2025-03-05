"use client";

import { useEffect, useState } from "react";
import EventCard from "@/components/EventComponent/EventCard";
import { useUser } from "@clerk/nextjs";
import { getEvents } from "@/app/actions/events/actions";
import { EventInfo } from "@/types/events";
import EventSection from "@/components/EventComponent/EventSection";
import SkeletonEventSection from "@/components/EventComponent/EventSectionSkeleton";
import { formatEvents } from "@/lib/utils";

export default function Home() {
  // TODO consider more possibilities (children registered, deadline missed, etc) and how to sort those cases
  const [eventSections, setEventSections] = useState<{
    all: EventInfo[];
    registered: EventInfo[];
    past: EventInfo[];
  }>({ all: [], registered: [], past: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isLoaded, user } = useUser();

  useEffect(() => {
    const fetchAndProcessEvents = async () => {
      try {
        // TODO render "all events" if user is not signed in instead of returning early
        if (!isLoaded || !user) return;

        const userResponse = await fetch(`/api/users/${user.id}`);
        if (!userResponse.ok) throw new Error("Failed to fetch user data");

        const userData = await userResponse.json();
        if (!userData?._id) throw new Error("User not Found in MongoDB");

        const events = await getEvents();
        const formattedEvents = formatEvents(events);
        const categorized = categorizeEvents(formattedEvents, userData._id.toString());

        setEventSections(categorized);
        setIsLoading(false);
      } catch (error: any) {
        setError(error.message || "Failed to load events");
        setIsLoading(false);
      }
    };

    fetchAndProcessEvents();
  }, [isLoaded, user]);

  if (isLoading)
    return (
      <main className="mx-auto mt-6 flex max-w-screen-2xl flex-col gap-8 px-8">
        <SkeletonEventSection />
        <SkeletonEventSection />
        <SkeletonEventSection />
      </main>
    );
  if (error) return <p>{error}</p>;

  return (
    <main className="mx-auto mb-8 mt-6 flex max-w-screen-2xl flex-col gap-8 px-8">
      <EventSection title="Registered Events" events={eventSections.registered} isRegisteredSection />
      <EventSection title="Available Events" events={eventSections.all} />
      <EventSection title="Past Events" events={eventSections.past} isRegisteredSection />
    </main>
  );
}

// Helper function
const categorizeEvents = (events: EventInfo[], userId: string) => {
  const now = new Date();
  const sections = { all: [], registered: [], past: [] } as {
    all: EventInfo[];
    registered: EventInfo[];
    past: EventInfo[];
  };

  events.forEach((event) => {
    if (event.registeredUsers.includes(userId)) {
      event.endDateTime && event.endDateTime < now ? sections.past.push(event) : sections.registered.push(event);
    } else {
      sections.all.push(event);
    }
  });

  return sections;
};
