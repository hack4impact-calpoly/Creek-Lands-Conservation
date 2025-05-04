// src/app/actions/events/actions.ts
"use server";

import connectDB from "@/database/db";
import Event from "@/database/eventSchema";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";
import { NextRequest } from "next/server";
import { LimitedEventInfo, RawEventWaiverTemplate, RawEvent } from "@/types/events";

export async function getEvents(req?: NextRequest): Promise<LimitedEventInfo[]> {
  await connectDB();

  // Fetch raw documents as plain objects
  const isAdmin = await authenticateAdmin();

  // Fetch raw documents as plain objects
  const docs = (await Event.find().sort({ startDate: 1 }).lean()) as unknown as RawEvent[];

  // Filter out draft events for normal users
  const filteredDocs = isAdmin ? docs : docs.filter((doc) => !doc.isDraft);
  // If admin, return full event info
  // Map documents to EventInfo or LimitedEventInfo
  const events = filteredDocs.map((doc) => {
    if (!doc._id || !mongoose.Types.ObjectId.isValid(doc._id)) {
      console.error("Invalid or missing _id on event doc:", doc);
      return null;
    }

    const id = doc._id.toString();
    const startDate = new Date(doc.startDate).toISOString();
    const endDate = new Date(doc.endDate).toISOString();
    const registrationDeadline = doc.registrationDeadline
      ? new Date(doc.registrationDeadline).toISOString()
      : undefined;

    const eventWaiverTemplates = Array.isArray(doc.eventWaiverTemplates)
      ? doc.eventWaiverTemplates.map((t: RawEventWaiverTemplate) => ({
          waiverId: t.waiverId.toString(),
          required: Boolean(t.required),
        }))
      : [];

    const limitedEvent: LimitedEventInfo = {
      id,
      title: String(doc.title),
      description: typeof doc.description === "string" ? doc.description : undefined,
      startDate,
      endDate,
      location: String(doc.location),
      capacity: Number(doc.capacity || 0),
      registrationDeadline,
      images: Array.isArray(doc.images) ? doc.images.map(String) : [],
      fee: Number(doc.fee || 0),
      stripePaymentId: doc.stripePaymentId ?? null,
      paymentNote: doc.paymentNote ?? "",
      isDraft: Boolean(doc.isDraft),
      eventWaiverTemplates,
      currentRegistrations:
        (Array.isArray(doc.registeredUsers) ? doc.registeredUsers.length : 0) +
        (Array.isArray(doc.registeredChildren) ? doc.registeredChildren.length : 0),
    };

    return limitedEvent;
  });

  // Filter out null entries (from skipped corrupt documents)
  return events.filter((event): event is LimitedEventInfo => event !== null);
}
