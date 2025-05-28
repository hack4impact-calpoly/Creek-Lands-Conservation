// src/app/api/events/[eventID]/participants/remove/route.ts
import connectDB from "@/database/db";
import Event from "@/database/eventSchema";
import User from "@/database/userSchema";
import Waiver from "@/database/waiverSchema";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";

export async function POST(request: NextRequest, { params }: { params: { eventID: string } }) {
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
