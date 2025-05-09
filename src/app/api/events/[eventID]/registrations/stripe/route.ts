// src/app/api/events/[eventID]/registration/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/database/db";
import Event from "@/database/eventSchema";
import User from "@/database/userSchema";
import mongoose from "mongoose";
import { RawRegisteredUser, RawRegisteredChild } from "@/types/events";
import { Stripe } from "stripe";
import { headers } from "next/headers";

interface RawChild {
  _id: mongoose.Types.ObjectId;
  registeredEvents: mongoose.Types.ObjectId[];
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// PUT: Register for an event
export async function PUT(req: NextRequest, { params }: { params: { eventID: string } }) {
  console.log("Incoming Headers:", Object.fromEntries(req.headers.entries()));

  const sig = headers().get("Stripe-Signature") || headers().get("Stripe-Signature");
  if (!sig) {
    console.error("Missing stripe-signature header");
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET!;

  // Read raw stream
  const chunks: Uint8Array[] = [];
  const reader = req.body!.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");

  let stripeEvent: Stripe.Event;

  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, secret);
    console.log("✅ Stripe event verified:", stripeEvent.type);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ Webhook verification failed:", message);
    return NextResponse.json({ message: `Webhook Error: ${message}` }, { status: 400 });
  }

  // Successfully constructed event.
  console.log("✅ Success:", stripeEvent.id);

  await connectDB();
  const { eventID } = params;

  if (!mongoose.Types.ObjectId.isValid(eventID)) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
  }

  const body = await req.json();
  const attendees: string[] = body.attendees;

  // handle stripe webhook req, sus code
  const userId = body.userId;

  if (!userId) {
    return new Response("Missing userId in internal request", { status: 400 });
  }

  // sus code end
  // might be better to remove this from the isPublicRoute check in middleware.ts
  // and make another api route for stripe webhooks

  const user = await User.findOne({ clerkID: userId });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (
    !Array.isArray(attendees) ||
    attendees.length === 0 ||
    !attendees.every((id) => mongoose.Types.ObjectId.isValid(id))
  ) {
    return NextResponse.json({ error: "Invalid attendees format." }, { status: 400 });
  }

  // Only allow user and their children
  const mongoUserId = user._id.toString();
  const validAttendees = [mongoUserId, ...(user.children as RawChild[]).map((c) => c._id.toString())];
  if (!attendees.every((id) => validAttendees.includes(id))) {
    return NextResponse.json({ error: "You can only register yourself or your children." }, { status: 403 });
  }

  const event = await Event.findById(eventID);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const now = new Date();
  if (event.registrationDeadline && now > new Date(event.registrationDeadline)) {
    return NextResponse.json({ error: "Registration deadline has passed" }, { status: 400 });
  }

  const newRegisteredUsers: mongoose.Types.ObjectId[] = [];
  const newRegisteredChildren: mongoose.Types.ObjectId[] = [];

  for (const id of attendees) {
    if (id === mongoUserId) {
      if (!event.registeredUsers.some((ru: RawRegisteredUser) => ru.user.toString() === id)) {
        event.registeredUsers.push({ user: user._id, waiversSigned: [] });
        user.registeredEvents.push(eventID);
        newRegisteredUsers.push(user._id);
      }
    } else {
      const child = (user.children as RawChild[]).find((c) => c._id.toString() === id);
      if (child && !event.registeredChildren.some((rc: RawRegisteredChild) => rc.childId.toString() === id)) {
        event.registeredChildren.push({
          parent: user._id,
          childId: child._id,
          waiversSigned: [],
        });
        child.registeredEvents.push(new mongoose.Types.ObjectId(eventID));
        newRegisteredChildren.push(child._id);
      }
    }
  }

  if (newRegisteredUsers.length + newRegisteredChildren.length === 0) {
    return NextResponse.json({ error: "Selected attendees are already registered." }, { status: 400 });
  }

  // Capacity check
  const totalRegistered = event.registeredUsers.length + event.registeredChildren.length;

  if (event.capacity > 0 && totalRegistered > event.capacity) {
    return NextResponse.json({ error: "Event is at full capacity" }, { status: 400 });
  }

  // Save in transaction
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await event.save({ session });
    await User.findByIdAndUpdate(
      user._id,
      { $set: { registeredEvents: user.registeredEvents, children: user.children } },
      { session },
    );
    await session.commitTransaction();
  } catch {
    await session.abortTransaction();
  } finally {
    session.endSession();
  }

  return NextResponse.json(
    {
      message: "Successfully registered",
      registeredUsers: newRegisteredUsers.map((o) => o.toString()),
      registeredChildren: newRegisteredChildren.map((o) => o.toString()),
    },
    { status: 200 },
  );
}

export const config = {
  api: {
    bodyParser: false, // Disable body parsing for this route
  },
};
