"use client";

import { useEffect, useState, createContext } from "react";
import EventCard from "@/components/EventComponent/EventCard";
import { useUser } from "@clerk/nextjs";
import { getEvents } from "@/app/actions/events/actions";
import { EventInfo } from "@/types/events";
import EventSection from "@/components/EventComponent/EventSection";
import SkeletonEventSection from "@/components/EventComponent/EventSectionSkeleton";
import { formatEvents } from "@/lib/utils";
import { loadStripe } from "@stripe/stripe-js";
import { Stripe } from "@stripe/stripe-js";

export const StripeContext = createContext<Promise<Stripe | null> | undefined>(undefined);

if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY === undefined) {
  throw new Error("STRIPE_PUBLISHABLE_KEY is not defined");
}
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);

export default function Home() {
  // TODO consider more possibilities (children registered, deadline missed, etc) and how to sort those cases
  const [eventSections, setEventSections] = useState<{
    available: EventInfo[];
    registered: EventInfo[];
    past: EventInfo[];
  }>({ available: [], registered: [], past: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isLoaded, user } = useUser();

  useEffect(() => {
    const fetchAndProcessEvents = async () => {
      try {
        if (!isLoaded) return; // Ensure user state is loaded before proceeding

        const events = await getEvents();
        const formattedEvents = formatEvents(events);

        if (user) {
          const userResponse = await fetch(`/api/users/${user.id}`);
          if (!userResponse.ok) throw new Error("Failed to fetch user data");

          const userData = await userResponse.json();
          if (!userData?._id) throw new Error("User not Found in MongoDB");

          const categorized = categorizeEvents(formattedEvents, userData._id.toString());
          setEventSections(categorized);
        } else {
          // If no user, just show all events
          setEventSections({ available: formattedEvents, registered: [], past: [] });
        }

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
      <main className="mx-auto mb-8 flex flex-col">
        <SkeletonEventSection title="Registered Events" />
        <SkeletonEventSection title="Available Events" />
        <SkeletonEventSection title="Past Events" />
      </main>
    );

  if (error) return <p>{error}</p>;

  return (
    <main className="mx-auto mb-8 flex flex-col">
      <StripeContext.Provider value={stripePromise}>
        <EventSection title="Registered Events" events={eventSections.registered} isRegisteredSection />
        <EventSection title="Available Events" events={eventSections.available} />
        <EventSection title="Past Events" events={eventSections.past} isRegisteredSection />
      </StripeContext.Provider>
    </main>
  );
}

// Helper function
const categorizeEvents = (events: EventInfo[], userId: string) => {
  const now = new Date();
  const sections = { available: [], registered: [], past: [] } as {
    available: EventInfo[];
    registered: EventInfo[];
    past: EventInfo[];
  };

  events.forEach((event) => {
    if (event.registeredUsers.includes(userId)) {
      event.endDateTime && event.endDateTime < now ? sections.past.push(event) : sections.registered.push(event);
    } else {
      sections.available.push(event);
    }
  });

  return sections;
};
