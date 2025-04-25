"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { getEvents } from "@/app/actions/events/actions";
import { EventInfo } from "@/types/events";
import EventSection from "@/components/EventComponent/EventSection";
import SkeletonEventSection from "@/components/EventComponent/EventSectionSkeleton";
import { formatEvents } from "@/lib/utils";

interface IChild {
  _id: string;
}

interface IUserData {
  _id: string;
  children: IChild[];
}

export default function Home() {
  // TODO consider more possibilities (children registered, deadline missed, etc) and how to sort those cases
  const [eventSections, setEventSections] = useState<{
    available: EventInfo[];
    registered: EventInfo[];
    past: EventInfo[];
  }>({ available: [], registered: [], past: [] });
  const [userData, setUserData] = useState<IUserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isLoaded, user } = useUser();

  // inside Home()
  const handleRegister = (eventId: string, attendees: string[]) => {
    if (!userData) return;
    const userId = userData._id;
    const childIds = userData.children.map((c) => c._id);

    setEventSections((prev) => {
      // flatten all sections into one array
      const allEvents = [...prev.available, ...prev.registered, ...prev.past];

      const updatedEvents = allEvents.map((event) => {
        if (event.id !== eventId) return event;

        const userAttending = attendees.includes(userId);
        const kidsAttending = attendees.filter((id) => childIds.includes(id));

        // append a new registeredUser object if needed
        const newRegisteredUsers = userAttending
          ? [...event.registeredUsers, { user: userId, waiversSigned: [] }]
          : event.registeredUsers;

        // append new registeredChildren objects if needed
        const newRegisteredChildren =
          kidsAttending.length > 0
            ? [
                ...event.registeredChildren,
                ...kidsAttending.map((childId) => ({
                  parent: userId,
                  childId,
                  waiversSigned: [],
                })),
              ]
            : event.registeredChildren;

        return {
          ...event,
          registeredUsers: newRegisteredUsers,
          registeredChildren: newRegisteredChildren,
        };
      });

      // re-categorize based on the freshly updated arrays
      return categorizeEvents(updatedEvents, userId, childIds);
    });
  };

  useEffect(() => {
    const fetchAndProcessEvents = async () => {
      try {
        if (!isLoaded) return; // Ensure user state is loaded before proceeding

        const events = await getEvents();
        console.log("Fetched Events:", events);
        const formattedEvents = formatEvents(events);
        console.log("Formatted Events:", formattedEvents);

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
// Helper at bottom of page.tsx
const categorizeEvents = (events: EventInfo[], userId: string, userChildren: string[]) => {
  const now = new Date();
  const sections = { available: [], registered: [], past: [] } as {
    available: EventInfo[];
    registered: EventInfo[];
    past: EventInfo[];
  };

  events.forEach((event) => {
    // look for a matching user field, not a raw string
    const userIsRegistered = event.registeredUsers.some((ru) => ru.user === userId);
    // look for childId in the child objects
    const childIsRegistered = event.registeredChildren.some((rc) => userChildren.includes(rc.childId));

    if (userIsRegistered || childIsRegistered) {
      if (event.endDateTime && event.endDateTime < now) {
        sections.past.push(event);
      } else {
        sections.registered.push(event);
      }
    } else {
      sections.available.push(event);
    }
  });

  return sections;
};
