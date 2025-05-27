import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDB from "@/database/db";
import Event from "@/database/eventSchema";
import User from "@/database/userSchema";
import Waiver from "@/database/waiverSchema";
import mongoose from "mongoose";
import { RawRegisteredUser, RawRegisteredChild } from "@/types/events";
import { deleteFileFromS3 } from "@/lib/s3";

interface RawChild {
  _id: mongoose.Types.ObjectId;
  registeredEvents: mongoose.Types.ObjectId[];
  waiversSigned?: mongoose.Types.ObjectId[]; // Add waiversSigned for children
}

// PUT: Register for an event (unchanged)
export async function PUT(req: NextRequest, { params }: { params: { eventID: string } }) {
  await connectDB();
  const { eventID } = params;

  if (!mongoose.Types.ObjectId.isValid(eventID)) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
  }

  const user = await User.findOne({ clerkID: userId });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await req.json();
  const attendees: string[] = body.attendees;

  if (
    !Array.isArray(attendees) ||
    attendees.length === 0 ||
    !attendees.every((id) => mongoose.Types.ObjectId.isValid(id))
  ) {
    return NextResponse.json({ error: "Invalid attendees format." }, { status: 400 });
  }

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

  const totalRegistered = event.registeredUsers.length + event.registeredChildren.length;
  if (event.capacity > 0 && totalRegistered > event.capacity) {
    return NextResponse.json({ error: "Event is at full capacity" }, { status: 400 });
  }

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
  } catch (err) {
    await session.abortTransaction();
    console.error("Error in registration transaction:", err);
    return NextResponse.json({ error: "Failed to register due to server error" }, { status: 500 });
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

// DELETE: Unregister from an event
export async function DELETE(req: NextRequest, { params }: { params: { eventID: string } }) {
  await connectDB();
  const { eventID } = params;

  if (!mongoose.Types.ObjectId.isValid(eventID)) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
  }

  const user = await User.findOne({ clerkID: userId });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await req.json();
  const attendees: string[] = body.attendees;
  if (
    !Array.isArray(attendees) ||
    attendees.length === 0 ||
    !attendees.every((id) => mongoose.Types.ObjectId.isValid(id))
  ) {
    return NextResponse.json({ error: "Invalid attendees format." }, { status: 400 });
  }

  const mongoUserId = user._id.toString();
  const validAttendees = [mongoUserId, ...(user.children as RawChild[]).map((c) => c._id.toString())];
  if (!attendees.every((id) => validAttendees.includes(id))) {
    return NextResponse.json({ error: "You can only unregister yourself or your children." }, { status: 403 });
  }

  const event = await Event.findById(eventID);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const removedUsers: mongoose.Types.ObjectId[] = [];
  const removedChildren: mongoose.Types.ObjectId[] = [];

  for (const id of attendees) {
    if (id === mongoUserId) {
      if (event.registeredUsers.some((ru: RawRegisteredUser) => ru.user.toString() === mongoUserId)) {
        event.registeredUsers = event.registeredUsers.filter(
          (ru: RawRegisteredUser) => ru.user.toString() !== mongoUserId,
        );
        user.registeredEvents = user.registeredEvents.filter(
          (eId: mongoose.Types.ObjectId) => eId.toString() !== eventID,
        );
        removedUsers.push(user._id);
      }
    } else {
      const child = (user.children as RawChild[]).find((c) => c._id.toString() === id);
      if (child && event.registeredChildren.some((rc: RawRegisteredChild) => rc.childId.toString() === id)) {
        event.registeredChildren = event.registeredChildren.filter(
          (rc: RawRegisteredChild) => rc.childId.toString() !== id,
        );
        child.registeredEvents = child.registeredEvents.filter(
          (eId: mongoose.Types.ObjectId) => eId.toString() !== eventID,
        );
        removedChildren.push(child._id);
      }
    }
  }

  if (removedUsers.length + removedChildren.length === 0) {
    return NextResponse.json({ error: "Selected attendees were not registered." }, { status: 400 });
  }

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
  } catch (err) {
    await session.abortTransaction();
    console.error("Error in unregistration transaction:", err);
    return NextResponse.json({ error: "Failed to unregister due to server error" }, { status: 500 });
  } finally {
    session.endSession();
  }

  // Delete waiver files from S3 and remove Waiver documents
  try {
    // Query waivers directly for the event and attendees
    const waiverQuery = {
      eventId: eventID,
      type: "completed",
      $or: [
        { belongsToUser: user._id, isForChild: false }, // User's waivers
        { belongsToUser: user._id, childSubdocId: { $in: removedChildren } }, // Children's waivers
      ],
    };
    const waivers = await Waiver.find(waiverQuery).select("fileKey belongsToUser childSubdocId");

    console.log(
      `Found ${waivers.length} waivers for event ${eventID}:`,
      waivers.map((w) => ({
        id: w._id.toString(),
        fileKey: w.fileKey,
        belongsToUser: w.belongsToUser.toString(),
        childSubdocId: w.childSubdocId?.toString(),
      })),
    );

    if (waivers.length === 0) {
      console.log(`No waivers found to delete for event ${eventID}`);
    }

    // Delete S3 files
    for (const waiver of waivers) {
      try {
        await deleteFileFromS3(waiver.fileKey);
        console.log(`Deleted S3 file: ${waiver.fileKey}`);
      } catch (s3Err) {
        console.error(`Failed to delete S3 file ${waiver.fileKey}:`, s3Err);
      }
    }

    // Update User waiversSigned
    for (const waiver of waivers) {
      if (waiver.childSubdocId) {
        const child = user.children.id(waiver.childSubdocId);
        if (child && Array.isArray(child.waiversSigned)) {
          child.waiversSigned = child.waiversSigned.filter((wId: mongoose.Types.ObjectId) => !wId.equals(waiver._id));
        }
      } else {
        user.waiversSigned = user.waiversSigned.filter((wId: mongoose.Types.ObjectId) => !wId.equals(waiver._id));
      }
    }
    await user.save();

    // Delete Waiver documents
    const deleteResult = await Waiver.deleteMany(waiverQuery);
    console.log(`Deleted ${deleteResult.deletedCount} Waiver documents for event ${eventID}`);
  } catch (err) {
    console.error("Error deleting waivers from S3 or MongoDB:", err);
  }

  return NextResponse.json({ message: "Successfully unregistered" }, { status: 200 });
}
