// src/app/api/events/[eventID]/participants/route.ts
import connectDB from "@/database/db";
import Event from "@/database/eventSchema";
import User from "@/database/userSchema";
import Waiver from "@/database/waiverSchema";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

// GET method - fetch event participants (your existing code)
export async function GET(req: NextRequest, { params }: { params: { eventID: string } }) {
  await connectDB();
  const { eventID } = params;

  if (!mongoose.Types.ObjectId.isValid(eventID)) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
  }

  const authError = await authenticateAdmin();
  const user = await User.findOne({ clerkID: userId });
  if (!user || !authError) {
    return NextResponse.json({ error: "Forbidden. You do not have access to this resource." }, { status: 403 });
  }

  try {
    const event = await Event.findById(eventID).populate("registeredUsers.user").populate({
      path: "registeredChildren.parent",
      select: "email firstName lastName children phoneNumbers address",
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Format the response to match your existing structure
    const response = {
      eventId: eventID,
      eventTitle: event.title,
      registeredUsers: event.registeredUsers || [],
      registeredChildren:
        event.registeredChildren?.map((child: any) => {
          const childData = child.parent?.children?.find((c: any) => c._id.toString() === child.childId.toString());
          return {
            ...child.toObject(),
            child: childData || null,
          };
        }) || [],
      totalParticipants: (event.registeredUsers?.length || 0) + (event.registeredChildren?.length || 0),
      capacity: event.capacity,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching participants:", error);
    return NextResponse.json(
      { error: "Error fetching participants", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

// DELETE method - remove participants
export async function DELETE(request: NextRequest, { params }: { params: { eventID: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Verify admin access
    const user = await User.findOne({ clerkID: userId });
    if (!user || user.userRole !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { eventID } = params;
    if (!mongoose.Types.ObjectId.isValid(eventID)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }

    const { participantId, isChild } = await request.json();
    if (!participantId) {
      return NextResponse.json({ error: "Participant ID required" }, { status: 400 });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const event = await Event.findById(eventID);
      if (!event) {
        throw new Error("Event not found");
      }

      if (isChild) {
        // Remove child from event
        event.registeredChildren = event.registeredChildren.filter(
          (child: any) => child.childId.toString() !== participantId,
        );

        // Remove event from child's profile
        await User.updateOne(
          { "children._id": participantId },
          { $pull: { "children.$.registeredEvents": eventID } },
          { session },
        );

        // Remove child's waivers for this event
        await Waiver.deleteMany(
          {
            eventId: eventID,
            childSubdocId: participantId,
            isForChild: true,
          },
          { session },
        );
      } else {
        // Remove user from event
        event.registeredUsers = event.registeredUsers.filter((user: any) => user.user.toString() !== participantId);

        // Remove event from user's profile
        await User.updateOne({ _id: participantId }, { $pull: { registeredEvents: eventID } }, { session });

        // Remove user's waivers for this event
        await Waiver.deleteMany(
          {
            eventId: eventID,
            belongsToUser: participantId,
            isForChild: false,
          },
          { session },
        );
      }

      await event.save({ session });
      await session.commitTransaction();

      return NextResponse.json({
        message: `${isChild ? "Child" : "User"} removed successfully`,
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error("Error removing participant:", error);
    return NextResponse.json({ error: "Failed to remove participant" }, { status: 500 });
  }
}
