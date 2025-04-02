import { EventInfo } from "@/types/events";
import EventCard from "./EventCard";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export default function EventSection({
  title,
  events,
  onDelete,
  onRegister,
  children,
}: {
  title: string;
  events: EventInfo[];
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
    /* scroll has to happen after re-render for optimal scrollage, 
    otherwise we scroll on click and then later the screen shifts */
    if (!isExpanded && hasMoreEvents) {
      // check if button was pressed vs a refresh happened or something
      if (prevIsExpandedRef.current === true) {
        // means we used to be expanded, and now aren't so button was pressed
        sectionRef.current?.scrollIntoView({
          behavior: "instant",
          block: "nearest",
        });
      }
    }
    // Update the ref with the current state after each render
    prevIsExpandedRef.current = isExpanded;
  }, [isExpanded, hasMoreEvents]);

  return (
    <section className="p-6" ref={sectionRef}>
      <div className="flex items-center justify-between">
        <h2 className="mb-6 text-4xl md:mb-8 md:text-5xl">{title}</h2>
        <div>{children}</div>
      </div>

      {events.length === 0 ? (
        <div className=" w-full rounded-lg p-8 text-center">
          <p className="text-2xl text-gray-500">No {title.toLowerCase()} found</p>
          <p className="mt-2 text-xl text-gray-400"> Check back later!</p>
        </div>
      ) : (
        <>
          {/* TODO figure out how to align this with the header better,
              removing justify center aligns the left edge, but the right edge is worse */}
          <div className="grid grid-cols-1 justify-items-center  gap-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {visibleEvents.map((event) => (
              <EventCard
                key={event.id}
                {...event}
                eventTitle={event.title}
                // most events do not yet reflect the addition of registeredChildren to the schema
                currentRegistrations={event.registeredUsers.length + event.registeredChildren.length}
                onDelete={onDelete}
                onRegister={onRegister}
              />
            ))}
          </div>
          {hasMoreEvents && (
            <div className="mt-4 flex justify-center">
              <Button onClick={() => setIsExpanded(!isExpanded)} className="bg-[#45575e]">
                {isExpanded ? "See Less" : "See More"}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
