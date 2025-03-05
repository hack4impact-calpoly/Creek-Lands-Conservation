import { EventInfo } from "@/types/events";
import EventCard from "./EventCard";
import { useState } from "react";
import { Button } from "../ui/button";

export default function EventSection({
  title,
  events,
  isRegisteredSection = false,
  children,
}: {
  title: string;
  events: EventInfo[];
  isRegisteredSection?: boolean;
  children?: React.ReactNode;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxInitialEvents = 6;
  const hasMoreEvents = events.length > maxInitialEvents;
  const visibleEvents = isExpanded ? events : events.slice(0, maxInitialEvents);

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="mb-6 text-4xl md:mb-8 md:text-5xl">{title}</h2>
        <div>{children}</div>
      </div>

      {events.length === 0 ? (
        <div className="rounded-lg bg-gray-50 p-8 text-center">
          <p className="text-gray-500">No {title.toLowerCase()} found</p>
          <p className="mt-2 text-gray-400"> Check back later!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 justify-items-center gap-4 md:grid-cols-2  lg:grid-cols-3">
            {visibleEvents.map((event) => (
              <EventCard
                key={event.id}
                {...event}
                eventTitle={event.title}
                currentRegistrations={event.registeredUsers.length}
                userRegistered={isRegisteredSection}
              />
            ))}
          </div>
          {hasMoreEvents && (
            <div className="mt-4 flex justify-center">
              <Button onClick={() => setIsExpanded(!isExpanded)} className="bg-gray-500">
                {isExpanded ? "See Less" : "See More"}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
