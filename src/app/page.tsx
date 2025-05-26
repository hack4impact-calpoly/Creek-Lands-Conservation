"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { getEvents } from "@/app/actions/events/actions";
import type { LimitedEventInfo } from "@/types/events";
import EventSection from "@/components/EventComponent/EventSection";
import SkeletonEventSection from "@/components/EventComponent/EventSectionSkeleton";

interface IChildData {
  _id: string;
  firstName: string;
  lastName: string;
  birthday?: string;
  gender: "Male" | "Female" | "Non-binary" | "Prefer Not to Say" | "";
  imageUrl?: string;
  imageKey?: string;
  registeredEvents: string[];
  waiversSigned: string[];
}

interface IUserData {
  _id: string;
  clerkID: string;
  userRole: "user" | "admin" | "donator";
  firstName: string;
  lastName: string;
  email: string;
  gender: "Male" | "Female" | "Non-binary" | "Prefer Not to Say" | "";
  birthday?: string | null;
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
  registeredEvents: string[];
  waiversSigned: string[];
}

export default function Home() {
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
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <SkeletonEventSection title="Registered Events" />
          <SkeletonEventSection title="Available Events" />
          <SkeletonEventSection title="Past Events" />
        </div>
      </main>
    );

  if (error)
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="mx-auto max-w-md px-6 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="mb-3 text-2xl font-semibold text-gray-900">Unable to Load Events</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </main>
    );

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="space-y-12">
          <EventSection title="My Registered Events" events={eventSections.registered} onRegister={handleRegister} />
          <EventSection title="Available Events" events={eventSections.available} onRegister={handleRegister} />
          <EventSection title="Past Events" events={eventSections.past} onRegister={handleRegister} />
        </div>
      </div>
    </main>
  );
}

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
