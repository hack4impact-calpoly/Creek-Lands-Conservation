"use server";

import connectDB from "@/database/db";
import Waiver from "@/database/waiverSchema";
import User from "@/database/userSchema";
import Event from "@/database/eventSchema";

// Define the interface for the full waiver document returned by the server action
interface FullSignedWaiver {
  waiver: {
    _id: string;
    fileKey: string;
    uploadedAt: Date;
    isForChild: boolean;
    childSubdocId?: string;
    eventId: string;
  };
  event: { title: string; startDate: string; endDate: string };
  childName?: string;
}

export async function getSignedWaiversForRegisteredEvents(userId: string): Promise<FullSignedWaiver[]> {
  await connectDB();

  // Step 1: Fetch the user with registered events and children
  const user = (await User.findById(userId).select("registeredEvents children").lean()) as {
    registeredEvents: string[];
    children: Array<{ _id: string; firstName: string; lastName: string; registeredEvents: string[] }>;
  } | null;

  if (!user) {
    throw new Error("User not found");
  }

  console.log("Debug: Fetched user:", {
    userId,
    registeredEvents: user.registeredEvents,
    children: user.children.map((child) => ({
      _id: child._id,
      registeredEvents: child.registeredEvents,
    })),
  });

  // Collect all event IDs (user's and children's)
  const userEventIds = user.registeredEvents || [];
  const childrenEventIds = user.children.flatMap((child) => child.registeredEvents || []);
  const allEventIds = Array.from(new Set([...userEventIds, ...childrenEventIds])); // Remove duplicates

  console.log("Debug: Collected event IDs:", {
    userEventIds,
    childrenEventIds,
    allEventIds,
  });

  if (allEventIds.length === 0) {
    console.log("Debug: No registered events found, returning empty array.");
    return [];
  }

  // Step 2: Fetch all events in one query
  const events = (await Event.find({ _id: { $in: allEventIds } })
    .select("title startDate endDate")
    .lean()) as unknown as Array<{ _id: string; title: string; startDate: Date; endDate: Date }>;

  console.log("Debug: Fetched events:", events);

  // Create a map of eventId to event details for quick lookup
  const eventMap = new Map<string, { title: string; startDate: Date; endDate: Date }>();
  events.forEach((event) => {
    eventMap.set(event._id.toString().trim(), {
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
    });
  });

  console.log("Debug: Event map entries:", Array.from(eventMap.entries()));

  // Step 3: Fetch all completed waivers for the user
  const waivers = (await Waiver.find({
    belongsToUser: userId,
    type: "completed",
    eventId: { $in: allEventIds },
  }).lean()) as unknown as Array<{
    _id: string;
    fileKey: string;
    childSubdocId?: string;
    isForChild: boolean;
    uploadedAt: Date;
    eventId: string;
  }>;

  console.log("Debug: Fetched waivers:", waivers);

  // Step 4: Map waivers to the FullSignedWaiver format
  const signedWaivers: FullSignedWaiver[] = waivers.map((waiver) => {
    const event = eventMap.get(waiver.eventId.toString().trim());
    console.log("Debug: Looking up event for waiver:", {
      waiverId: waiver._id,
      eventId: waiver.eventId,
      foundEvent: event,
    });

    let childName: string | undefined;
    if (waiver.isForChild && waiver.childSubdocId) {
      const child = user.children.find((c) => c._id === waiver.childSubdocId);
      childName = child ? `${child.firstName} ${child.lastName}` : undefined;
    }

    return {
      waiver: {
        _id: waiver._id,
        fileKey: waiver.fileKey,
        uploadedAt: waiver.uploadedAt,
        isForChild: waiver.isForChild,
        childSubdocId: waiver.childSubdocId,
        eventId: waiver.eventId,
      },
      event: {
        title: event?.title || "Generic Waiver",
        startDate: event?.startDate.toISOString() || "",
        endDate: event?.endDate.toISOString() || "",
      },
      childName,
    };
  });

  console.log("Debug: Final signed waivers:", signedWaivers);
  return signedWaivers;
}
