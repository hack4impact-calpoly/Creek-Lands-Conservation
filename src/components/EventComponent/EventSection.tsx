"use client";

import type React from "react";
import type { LimitedEventInfo } from "@/types/events";
import EventCard from "./EventCard";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function EventSection({
  title,
  events,
  onDelete,
  onRegister,
  children,
}: {
  title: string;
  events: LimitedEventInfo[];
  onDelete?: (eventId: string) => void;
  onRegister?: (eventId: string, attendees: string[]) => void;
  children?: React.ReactNode;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const is2xl = useMediaQuery("(min-width: 1536px)");
  const maxInitialEvents = is2xl ? 8 : 6;
  const hasMoreEvents = events.length > maxInitialEvents;
  const visibleEvents = isExpanded ? events : events.slice(0, maxInitialEvents);
  const sectionRef = useRef<HTMLHeadElement | null>(null);
  const prevIsExpandedRef = useRef<boolean>();

  useEffect(() => {
    if (!isExpanded && hasMoreEvents) {
      if (prevIsExpandedRef.current === true) {
        sectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
    prevIsExpandedRef.current = isExpanded;
  }, [isExpanded, hasMoreEvents]);

  return (
    <section ref={sectionRef} className="mb-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="mb-1 text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600">
            {events.length} {events.length === 1 ? "event" : "events"}
          </p>
        </div>
        <div>{children}</div>
      </div>

      {events.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="mb-1 text-lg font-semibold text-gray-900">No events found</h3>
          <p className="text-gray-600">Check back later for new events.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {visibleEvents.map((event) => (
              <EventCard
                key={event.id}
                id={event.id}
                eventTitle={event.title}
                startDateTime={event.startDate}
                endDateTime={event.endDate}
                location={event.location}
                description={event.description ?? "There is no description for this event."}
                images={event.images}
                registrationDeadline={event.registrationDeadline ? new Date(event.registrationDeadline) : null}
                capacity={event.capacity}
                currentRegistrations={event.currentRegistrations}
                eventWaiverTemplates={event.eventWaiverTemplates}
                onDelete={onDelete}
                onRegister={onRegister}
              />
            ))}
          </div>

          {hasMoreEvents && (
            <div className="mt-6 flex justify-center">
              <Button
                onClick={() => setIsExpanded(!isExpanded)}
                variant="outline"
                className="border-gray-300 px-6 py-2 text-gray-700 transition-colors duration-200 hover:border-gray-400 hover:bg-gray-50"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="mr-2 h-4 w-4" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    Show {events.length - maxInitialEvents} More
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
