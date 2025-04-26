// src/app/actions/events/actions.ts
"use server";

import connectDB from "@/database/db";
import Event from "@/database/eventSchema";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";
import { NextRequest } from "next/server";

export interface EventInfo {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location: string;
  capacity: number;
  registrationDeadline?: string;
  images: string[];
  fee: number;
  stripePaymentId?: string | null;
  paymentNote?: string;
  isDraft: boolean;
  registeredUsers: {
    user: string;
    waiversSigned: { waiverId: string; signed: boolean }[];
  }[];
  registeredChildren: {
    parent: string;
    childId: string;
    waiversSigned: { waiverId: string; signed: boolean }[];
  }[];
  eventWaiverTemplates: {
    waiverId: string;
    required: boolean;
  }[];
  currentRegistrations: number;
}

interface LimitedEventInfo {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location: string;
  capacity: number;
  registrationDeadline?: string;
  images: string[];
  fee: number;
  stripePaymentId?: string | null;
  paymentNote?: string;
  eventWaiverTemplates: {
    waiverId: string;
    required: boolean;
  }[];
  currentRegistrations: number;
}

const toLimitedEventInfo = (event: EventInfo): LimitedEventInfo => ({
  id: event.id,
  title: event.title,
  description: event.description,
  startDate: event.startDate,
  endDate: event.endDate,
  location: event.location,
  capacity: event.capacity,
  registrationDeadline: event.registrationDeadline,
  images: event.images,
  fee: event.fee,
  stripePaymentId: event.stripePaymentId,
  paymentNote: event.paymentNote,
  eventWaiverTemplates: event.eventWaiverTemplates,
  currentRegistrations: event.currentRegistrations,
});

export async function getEvents(req?: NextRequest): Promise<(EventInfo | LimitedEventInfo)[]> {
  await connectDB();

  // Fetch raw documents as plain objects
  const isAdmin = await authenticateAdmin();

  // Fetch raw documents as plain objects
  const docs: any[] = await Event.find().sort({ startDate: 1 }).lean();

  // Filter out draft events for normal users
  const filteredDocs = isAdmin ? docs : docs.filter((doc) => !doc.isDraft);
  // If admin, return full event info
  // Map documents to EventInfo or LimitedEventInfo
  const events = filteredDocs.map((doc) => {
    if (!doc._id || !mongoose.Types.ObjectId.isValid(doc._id)) {
      console.error("Invalid or missing _id on event doc:", doc);
      throw new Error("Corrupt event in database");
    }

    const id = doc._id.toString();
    const startDate = new Date(doc.startDate).toISOString();
    const endDate = new Date(doc.endDate).toISOString();
    const registrationDeadline = doc.registrationDeadline
      ? new Date(doc.registrationDeadline).toISOString()
      : undefined;

    const registeredUsers = Array.isArray(doc.registeredUsers)
      ? doc.registeredUsers.map((ru: any) => ({
          user: ru.user.toString(),
          waiversSigned: Array.isArray(ru.waiversSigned)
            ? ru.waiversSigned.map((w: any) => ({
                waiverId: w.waiverId.toString(),
                signed: Boolean(w.signed),
              }))
            : [],
        }))
      : [];

    const registeredChildren = Array.isArray(doc.registeredChildren)
      ? doc.registeredChildren.map((rc: any) => ({
          parent: rc.parent.toString(),
          childId: rc.childId.toString(),
          waiversSigned: Array.isArray(rc.waiversSigned)
            ? rc.waiversSigned.map((w: any) => ({
                waiverId: w.waiverId.toString(),
                signed: Boolean(w.signed),
              }))
            : [],
        }))
      : [];

    const eventWaiverTemplates = Array.isArray(doc.eventWaiverTemplates)
      ? doc.eventWaiverTemplates.map((t: any) => ({
          waiverId: t.waiverId.toString(),
          required: Boolean(t.required),
        }))
      : [];

    const fullEvent: EventInfo = {
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
      registeredUsers,
      registeredChildren,
      eventWaiverTemplates,
      currentRegistrations: registeredUsers.length + registeredChildren.length,
    };

    // Return limited fields for normal users, full fields for admins
    return isAdmin ? fullEvent : toLimitedEventInfo(fullEvent);
  });

  return events;
}
