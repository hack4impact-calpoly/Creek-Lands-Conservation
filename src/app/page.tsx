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
    available: EventInfo[];
    registered: EventInfo[];
    past: EventInfo[];
  }>({ available: [], registered: [], past: [] });
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isLoaded, user } = useUser();

  const handleRegister = (eventId: string, attendees: string[]) => {
    setEventSections((prev) => {
      // Update all sections, not just available, to ensure the event is found
      const allEvents = [...prev.available, ...prev.registered, ...prev.past];
      const updatedEvents = allEvents.map((event) => {
        if (event.id === eventId) {
          const userId = userData?._id || "";
          const userChildren = userData?.children.map((c: any) => c._id) || [];
          const userIsRegistered = attendees.includes(userId);
          const childIsRegistered = attendees.some((id) => userChildren.includes(id));
          const updatedEvent = {
            ...event,
            registeredUsers: userIsRegistered ? [...event.registeredUsers, userId] : event.registeredUsers,
            registeredChildren: childIsRegistered
              ? [...event.registeredChildren, ...attendees.filter((id) => userChildren.includes(id))]
              : event.registeredChildren,
          };
          console.log("Updated event:", updatedEvent.id, "registeredUsers:", updatedEvent.registeredUsers);
          return updatedEvent;
        }
        return event;
      });
      const newSections = categorizeEvents(
        updatedEvents,
        userData?._id || "",
        userData?.children.map((c) => c._id) || [],
      );
      console.log(
        "New sections - Registered:",
        newSections.registered.map((e) => e.id),
      );
      return newSections;
    });
  };

  useEffect(() => {
    const fetchAndProcessEvents = async () => {
      try {
        if (!isLoaded) return; // Ensure user state is loaded before proceeding

        const events = await getEvents();
        const formattedEvents = formatEvents(events);

        if (user) {
          const userResponse = await fetch(`/api/users/${user.id}`);
          if (!userResponse.ok) throw new Error("Failed to fetch user data");

          const fetchedUserData = await userResponse.json();
          if (!fetchedUserData?._id) throw new Error("User not Found in MongoDB");

          setUserData(fetchedUserData);

          const categorized = categorizeEvents(
            formattedEvents,
            fetchedUserData._id.toString(),
            fetchedUserData.children.map((child: any) => child._id),
          );
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
      <EventSection title="Registered Events" events={eventSections.registered} onRegister={handleRegister} />
      <EventSection title="Available Events" events={eventSections.available} onRegister={handleRegister} />
      <EventSection title="Past Events" events={eventSections.past} onRegister={handleRegister} />
    </main>
  );
}

// Helper function
const categorizeEvents = (events: EventInfo[], userId: string, userChildren: string[]) => {
  const now = new Date();
  const sections = { available: [], registered: [], past: [] } as {
    available: EventInfo[];
    registered: EventInfo[];
    past: EventInfo[];
  };
  events.forEach((event) => {
    // events for which a child is registered will also appear on the Registered tab
    const userIsRegistered = event.registeredUsers.includes(userId);
    const childIsRegistered = event.registeredChildren.some((childId) => userChildren.includes(childId));
    if (userIsRegistered || childIsRegistered) {
      event.endDateTime && event.endDateTime < now ? sections.past.push(event) : sections.registered.push(event);
    } else {
      sections.available.push(event);
    }
  });

  return sections;
};
