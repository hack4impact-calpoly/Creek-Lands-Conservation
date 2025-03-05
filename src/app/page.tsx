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
  // TODO consider more possibilities (children registered, deadline missed, etc) and how to sort those cases
  const [eventSections, setEventSections] = useState<{
    all: IEvent[];
    registered: IEvent[];
    past: IEvent[];
  }>({ all: [], registered: [], past: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isLoaded, user } = useUser();

  useEffect(() => {
    const fetchAndProcessEvents = async () => {
      try {
        if (!isLoaded || !user) return;

        const userResponse = await fetch(`/api/users/${user.id}`);
        if (!userResponse.ok) throw new Error("Failed to fetch user data");

        const userData = await userResponse.json();
        if (!userData?._id) throw new Error("User not Found in MongoDB");

        const events = await getEvents();
        const formattedEvents = formatEvents(events);
        const categorized = categorizeEvents(formattedEvents, userData._id.toString());

        setEventSections(categorized);
      } catch (error: any) {
        setError(error.message || "Failed to load events");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndProcessEvents();
  }, [isLoaded, user]);

  if (isLoading) return <p>Loading events...</p>;
  if (error) return <p>{error}</p>;

  return (
    <main className="mx-auto flex max-w-screen-2xl flex-col gap-8 px-8">
      <EventSection title="Registered Events" events={eventSections.registered} isRegisteredSection />
      <EventSection title="All Events" events={eventSections.all} />
      <EventSection title="My Past Events" events={eventSections.past} isRegisteredSection />
    </main>
  );
}

const EventSection = ({
  title,
  events,
  isRegisteredSection = false,
}: {
  title: string;
  events: IEvent[];
  isRegisteredSection?: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxInitialEvents = 6;
  const hasMoreEvents = events.length > maxInitialEvents;
  const visibleEvents = isExpanded ? events : events.slice(0, maxInitialEvents);

  return (
    <section className="p-3">
      <h2 className="mb-6 text-4xl md:mb-8 md:text-5xl">{title}</h2>
      <EventGrid events={visibleEvents} isRegisteredSection={isRegisteredSection} />
      {hasMoreEvents && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded bg-gray-300 px-4 py-2 transition-colors hover:bg-gray-400"
          >
            {isExpanded ? "See Less" : "See More"}
          </button>
        </div>
      )}
    </section>
  );
};

const EventGrid = ({ events, isRegisteredSection }: { events: IEvent[]; isRegisteredSection: boolean }) => (
  <div className="grid grid-cols-1 justify-items-center gap-4 md:grid-cols-2 md:justify-items-start lg:grid-cols-3">
    {events.map((event) => (
      <EventCard
        key={event.id}
        {...event}
        eventTitle={event.title}
        currentRegistrations={event.registeredUsers.length}
        userRegistered={isRegisteredSection}
      />
    ))}
  </div>
);

// Helper functions
const formatEvents = (data: any[]): IEvent[] =>
  data.map((event) => ({
    id: event._id.toString(),
    title: event.title || "Untitled Event",
    startDateTime: event.startDate ? new Date(event.startDate) : null,
    endDateTime: event.endDate ? new Date(event.endDate) : null,
    location: event.location || "Location not available",
    description: event.description || "No description provided",
    images: Array.isArray(event.images) ? event.images : [],
    registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline) : null,
    capacity: event.capacity || 0,
    registeredUsers: event.registeredUsers?.map((u: any) => u.toString()) || [],
  }));

const categorizeEvents = (events: IEvent[], userId: string) => {
  const now = new Date();
  const sections = { all: [], registered: [], past: [] } as {
    all: IEvent[];
    registered: IEvent[];
    past: IEvent[];
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
