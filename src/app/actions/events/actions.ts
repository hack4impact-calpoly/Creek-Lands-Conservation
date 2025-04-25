// src/app/actions/events/actions.ts
"use server";

import connectDB from "@/database/db";
import Event from "@/database/eventSchema";
import mongoose from "mongoose";

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

export async function getEvents(): Promise<EventInfo[]> {
  await connectDB();

  // Fetch raw documents as plain objects
  const docs: any[] = await Event.find().sort({ startDate: 1 }).lean(); // no generic here!

  return docs.map((doc) => {
    // Basic sanity check
    if (!doc._id || !mongoose.Types.ObjectId.isValid(doc._id)) {
      console.error("Invalid or missing _id on event doc:", doc);
      throw new Error("Corrupt event in database");
    }

    // Stringify IDs and dates
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

    return {
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
  });
}
