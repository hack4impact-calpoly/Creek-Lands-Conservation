"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { getEvents } from "@/app/actions/events/actions";
import { EventInfo, LimitedEventInfo } from "@/types/events";
import EventSection from "@/components/EventComponent/EventSection";
import SkeletonEventSection from "@/components/EventComponent/EventSectionSkeleton";
import { formatEvents } from "@/lib/utils";

interface IChildData {
  _id: string;
  firstName: string;
  lastName: string;
  birthday?: string; // ISO string from Date
  gender: "Male" | "Female" | "Non-binary" | "Prefer Not to Say" | "";
  imageUrl?: string;
  imageKey?: string;
  registeredEvents: string[]; // ObjectIds as strings
  waiversSigned: string[]; // ObjectIds as strings
}

interface IUserData {
  _id: string;
  clerkID: string;
  userRole: "user" | "admin" | "donator";
  firstName: string;
  lastName: string;
  email: string;
  gender: "Male" | "Female" | "Non-binary" | "Prefer Not to Say" | "";
  birthday?: string | null; // ISO string or null
  address?: {
    home?: string;
    city?: string;
    zipCode?: string;
  };
  phoneNumbers?: {
    cell?: string;
    work?: string;
  };
  imageUrl?: string;
  imageKey?: string;
  children: IChildData[];
  registeredEvents: string[]; // ObjectIds as strings
  waiversSigned: string[]; // ObjectIds as strings
}

export default function Home() {
  // TODO consider more possibilities (children registered, deadline missed, etc) and how to sort those cases
  const [eventSections, setEventSections] = useState<{
    available: LimitedEventInfo[];
    registered: LimitedEventInfo[];
    past: LimitedEventInfo[];
  }>({ available: [], registered: [], past: [] });
  const [userData, setUserData] = useState<IUserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isLoaded, user } = useUser();

  const handleRegister = async (eventId: string, attendees: string[]) => {
    if (!userData) return;

    // Update userData with registered events
    const updatedUserData = { ...userData };
    if (attendees.includes(userData._id)) {
      updatedUserData.registeredEvents = [...(updatedUserData.registeredEvents || []), eventId];
    }
    updatedUserData.children = updatedUserData.children.map((child) => {
      if (attendees.includes(child._id)) {
        return {
          ...child,
          registeredEvents: [...(child.registeredEvents || []), eventId],
        };
      }
      return child;
    });
    setUserData(updatedUserData);

    // Update eventSections with new registration count and categorization
    const allEvents = [...eventSections.available, ...eventSections.registered, ...eventSections.past];
    const updatedEvents = allEvents.map((event) => {
      if (event.id === eventId) {
        return { ...event, currentRegistrations: event.currentRegistrations + attendees.length };
      }
      return event;
    });

    const registeredEventIds = [
      ...(updatedUserData.registeredEvents || []),
      ...(updatedUserData.children || []).flatMap((child) => child.registeredEvents || []),
    ];
    const categorized = categorizeEvents(updatedEvents, registeredEventIds);
    setEventSections(categorized);
  };

  useEffect(() => {
    const fetchAndProcessEvents = async () => {
      if (!isLoaded) return;
      setIsLoading(true);

      try {
        const events = (await getEvents()) as LimitedEventInfo[];

        if (user) {
          const userResponse = await fetch(`/api/users/${user.id}`);
          if (!userResponse.ok) throw new Error("Failed to fetch user data");

          const fetchedUserData: IUserData = await userResponse.json();
          if (!fetchedUserData?._id) throw new Error("User not found in MongoDB");

          setUserData(fetchedUserData);

          const registeredEventIds = [
            ...(fetchedUserData.registeredEvents || []),
            ...(fetchedUserData.children || []).flatMap((child) => child.registeredEvents || []),
          ];

          const categorized = categorizeEvents(events, registeredEventIds);
          setEventSections(categorized);
        } else {
          setEventSections({ available: events, registered: [], past: [] });
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
// Categorize events using LimitedEventInfo and user's registered event IDs
const categorizeEvents = (events: LimitedEventInfo[], registeredEventIds: string[]) => {
  const now = new Date();
  const sections = {
    available: [] as LimitedEventInfo[],
    registered: [] as LimitedEventInfo[],
    past: [] as LimitedEventInfo[],
  };

  events.forEach((event) => {
    const endDateTime = new Date(event.endDate);
    const isRegistered = registeredEventIds.includes(event.id);

    if (endDateTime < now) {
      sections.past.push(event);
    } else if (isRegistered) {
      sections.registered.push(event);
    } else {
      sections.available.push(event);
    }
  });

  return sections;
};
