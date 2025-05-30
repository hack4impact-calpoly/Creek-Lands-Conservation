import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDB from "@/database/db";
import Event from "@/database/eventSchema";
import User from "@/database/userSchema";
import Waiver from "@/database/waiverSchema";
import mongoose from "mongoose";
import { RawRegisteredUser, RawRegisteredChild } from "@/types/events";
import { deleteFileFromS3 } from "@/lib/s3";
import { authenticateAdmin } from "@/lib/auth";

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

  const isAdmin = await authenticateAdmin();
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

  // For non-admins, restrict to self or children
  if (!isAdmin) {
    const mongoUserId = user._id.toString();
    const validAttendees = [mongoUserId, ...(user.children as RawChild[]).map((c) => c._id.toString())];
    if (!attendees.every((id) => validAttendees.includes(id))) {
      return NextResponse.json({ error: "You can only unregister yourself or your children." }, { status: 403 });
    }
  }

  const event = await Event.findById(eventID);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Categorize attendees into users and children
  const removedUserIds: string[] = [];
  const removedChildrenPairs: { parentId: string; childId: string }[] = [];
  for (const id of attendees) {
    const userReg = event.registeredUsers.find((ru: RawRegisteredUser) => ru.user.toString() === id);
    if (userReg) {
      removedUserIds.push(id);
    } else {
      const childReg = event.registeredChildren.find((rc: RawRegisteredChild) => rc.childId.toString() === id);
      if (childReg) {
        removedChildrenPairs.push({ parentId: childReg.parent.toString(), childId: id });
      }
    }
  }

  if (removedUserIds.length === 0 && removedChildrenPairs.length === 0) {
    return NextResponse.json({ error: "No valid attendees to remove." }, { status: 400 });
  }

  // Remove attendees from event
  event.registeredUsers = event.registeredUsers.filter(
    (ru: RawRegisteredUser) => !removedUserIds.includes(ru.user.toString()),
  );
  event.registeredChildren = event.registeredChildren.filter(
    (rc: RawRegisteredChild) => !removedChildrenPairs.some((pair) => pair.childId === rc.childId.toString()),
  );

  // Start transaction to update event, user documents, and waivers
  const session = await mongoose.startSession();
  session.startTransaction();
  let waivers: any[] = []; // Store waivers for use outside transaction
  try {
    // Save updated event
    await event.save({ session });

    // Update removed users' registeredEvents
    for (const userId of removedUserIds) {
      await User.findByIdAndUpdate(userId, { $pull: { registeredEvents: eventID } }, { session });
    }

    // Update parents of removed children's registeredEvents
    const parentIds = [...new Set(removedChildrenPairs.map((pair) => pair.parentId))];
    for (const parentId of parentIds) {
      const childrenToUpdate = removedChildrenPairs
        .filter((pair) => pair.parentId === parentId)
        .map((pair) => pair.childId);
      await User.findByIdAndUpdate(
        parentId,
        {
          $pull: { "children.$[child].registeredEvents": eventID },
        },
        {
          arrayFilters: [{ "child._id": { $in: childrenToUpdate } }],
          session,
        },
      );
    }

    // Handle waivers within the transaction
    const waiverQuery = {
      eventId: eventID,
      type: "completed",
      $or: [
        { belongsToUser: { $in: removedUserIds }, isForChild: false },
        ...removedChildrenPairs.map((pair) => ({ belongsToUser: pair.parentId, childSubdocId: pair.childId })),
      ],
    };
    waivers = await Waiver.find(waiverQuery).session(session);

    // Collect waiver IDs to update users and children
    const userWaiverMap = new Map<string, mongoose.Types.ObjectId[]>();
    const childWaiverMap = new Map<
      string,
      { parentId: string; childId: string; waiverIds: mongoose.Types.ObjectId[] }
    >();
    for (const waiver of waivers) {
      if (!waiver.isForChild) {
        const userId = waiver.belongsToUser.toString();
        if (!userWaiverMap.has(userId)) userWaiverMap.set(userId, []);
        userWaiverMap.get(userId)!.push(waiver._id);
      } else {
        const parentId = waiver.belongsToUser.toString();
        const childId = waiver.childSubdocId!.toString();
        const key = `${parentId}-${childId}`;
        if (!childWaiverMap.has(key)) {
          childWaiverMap.set(key, { parentId, childId, waiverIds: [] });
        }
        childWaiverMap.get(key)!.waiverIds.push(waiver._id);
      }
    }

    // Update waiversSigned in user documents within the transaction
    for (const [userId, waiverIds] of userWaiverMap) {
      await User.findByIdAndUpdate(userId, { $pull: { waiversSigned: { $in: waiverIds } } }, { session });
    }
    for (const { parentId, childId, waiverIds } of childWaiverMap.values()) {
      await User.findByIdAndUpdate(
        parentId,
        {
          $pull: { "children.$[child].waiversSigned": { $in: waiverIds } },
        },
        {
          arrayFilters: [{ "child._id": childId }],
          session,
        },
      );
    }

    // Delete waiver documents within the transaction
    await Waiver.deleteMany({ _id: { $in: waivers.map((w) => w._id) } }, { session });

    // Commit the transaction
    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    console.error("Error in unregistration transaction:", err);
    return NextResponse.json({ error: "Failed to unregister due to server error" }, { status: 500 });
  } finally {
    session.endSession();
  }

  // Delete S3 files after transaction commits using the same waivers
  for (const waiver of waivers) {
    try {
      await deleteFileFromS3(waiver.fileKey);
      console.log(`Deleted S3 file: ${waiver.fileKey}`);
    } catch (s3Err) {
      console.error(`Failed to delete S3 file ${waiver.fileKey}:`, s3Err);
    }
  }

  return NextResponse.json({ message: "Successfully unregistered" }, { status: 200 });
}
