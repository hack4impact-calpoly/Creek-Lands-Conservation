"use client";

import { useEffect, useState } from "react";
import { getEvents } from "@/app/actions/events/actions";
import type { LimitedEventInfo } from "@/types/events";
import EventSection from "@/components/EventComponent/EventSection";
import SkeletonEventSection from "@/components/EventComponent/EventSectionSkeleton";
import Link from "next/link";
import { Plus, Calendar, Users, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  const [eventSections, setEventSections] = useState<{
    unpublished: LimitedEventInfo[];
    active: LimitedEventInfo[];
    upcoming: LimitedEventInfo[];
    past: LimitedEventInfo[];
  }>({ unpublished: [], active: [], upcoming: [], past: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAndProcessEvents = async () => {
    try {
      const events = await getEvents();
      const categorized = categorizeEvents(events);
      setEventSections(categorized);
      setIsLoading(false);
    } catch (error: any) {
      setError(error.message || "Failed to load events");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAndProcessEvents();
    const interval = setInterval(() => {
      fetchAndProcessEvents();
    }, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const handleDeleteEvent = (eventId: string) => {
    setEventSections((prev) => ({
      unpublished: prev.unpublished.filter((event) => event.id !== eventId),
      active: prev.active.filter((event) => event.id !== eventId),
      upcoming: prev.upcoming.filter((event) => event.id !== eventId),
      past: prev.past.filter((event) => event.id !== eventId),
    }));
  };

  const totalEvents =
    eventSections.unpublished.length +
    eventSections.active.length +
    eventSections.upcoming.length +
    eventSections.past.length;
  const totalRegistrations = [...eventSections.active, ...eventSections.upcoming].reduce(
    (sum, event) => sum + (event.currentRegistrations || 0),
    0,
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Event Management</h1>
          <p className="text-gray-600">Manage your events and registrations</p>
        </div>
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
        <SkeletonEventSection title="Loading Events..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-600">Error Loading Events</h1>
          <p className="text-gray-600">{error}</p>
          <Button onClick={fetchAndProcessEvents} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Event Management</h1>
        <p className="text-gray-600">Manage your events and registrations</p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              {eventSections.active.length + eventSections.upcoming.length} active/upcoming
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRegistrations}</div>
            <p className="text-xs text-muted-foreground">Across active and upcoming events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventSections.active.length}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventSections.upcoming.length}</div>
            <p className="text-xs text-muted-foreground">Scheduled for future</p>
          </CardContent>
        </Card>
      </div>

      {/* Create Event Card */}
      <Card className="mb-8 border-2 border-dashed border-green-300 bg-green-50/50 transition-colors hover:bg-green-50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Plus className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-xl text-green-800">Create New Event</CardTitle>
          <CardDescription className="text-green-700">
            Start organizing your next event by creating a new event listing
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Link href="/admin/events/create">
            <Button size="lg" className="bg-green-600 px-8 text-white hover:bg-green-700">
              <Plus className="mr-2 h-5 w-5" />
              Create Event
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Event Sections */}
      <div className="space-y-8">
        {eventSections.unpublished.length > 0 && (
          <EventSection title="Draft Events" events={eventSections.unpublished} onDelete={handleDeleteEvent} />
        )}

        {eventSections.active.length > 0 && (
          <EventSection title="Active Events" events={eventSections.active} onDelete={handleDeleteEvent} />
        )}

        {eventSections.upcoming.length > 0 && (
          <EventSection title="Upcoming Events" events={eventSections.upcoming} onDelete={handleDeleteEvent} />
        )}

        {eventSections.past.length > 0 && (
          <EventSection title="Past Events" events={eventSections.past} onDelete={handleDeleteEvent} />
        )}
      </div>

      {/* Empty State */}
      {totalEvents === 0 && (
        <Card className="py-12 text-center">
          <CardContent>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">No events yet</h3>
            <p className="mb-6 text-gray-600">Get started by creating your first event</p>
            <Link href="/admin/events/create">
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Event
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const categorizeEvents = (events: LimitedEventInfo[]) => {
  const now = new Date();
  const sections = {
    unpublished: [] as LimitedEventInfo[],
    active: [] as LimitedEventInfo[],
    upcoming: [] as LimitedEventInfo[],
    past: [] as LimitedEventInfo[],
  };

  events.forEach((event) => {
    // Handle draft events first
    if (event.isDraft) {
      sections.unpublished.push(event);
      return;
    }

    // Parse dates
    const startDate = event.startDate ? new Date(event.startDate) : null;
    const endDate = event.endDate ? new Date(event.endDate) : null;

    // Validate dates
    if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      if (startDate <= now && endDate >= now) {
        sections.active.push(event);
      } else if (startDate > now) {
        sections.upcoming.push(event);
      } else {
        sections.past.push(event);
      }
    } else if (startDate && !isNaN(startDate.getTime()) && startDate > now) {
      sections.upcoming.push(event);
    } else {
      sections.past.push(event); // Default to past for invalid/missing dates
    }
  });

  return sections;
};
