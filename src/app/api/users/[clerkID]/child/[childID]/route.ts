// src/app/api/users/[clerkID]/child/[childID]/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/database/db";
import User from "@/database/userSchema";
import Event from "@/database/eventSchema"; // Import the Event model
import Waiver from "@/database/waiverSchema";
import mongoose from "mongoose";

export async function DELETE(req: NextRequest, { params }: { params: { clerkID: string; childID: string } }) {
  console.log(`[DELETE] Received request for clerkID: ${params.clerkID}, childID: ${params.childID}`);

  try {
    await connectDB();
    console.log("[DELETE] Database connected");

    const { clerkID, childID } = params;
    const normalizedClerkID = clerkID.trim();

    // Validate childID
    if (!mongoose.Types.ObjectId.isValid(childID)) {
      console.error(`[DELETE] Invalid childID format: ${childID}`);
      return NextResponse.json({ error: "Invalid child ID format" }, { status: 400 });
    }

    // Find the user
    console.log(`[DELETE] Querying user with clerkID: ${normalizedClerkID}`);
    const user = await User.findOne({ clerkID: normalizedClerkID });
    if (!user) {
      console.error(`[DELETE] User not found for clerkID: ${normalizedClerkID}`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.log(`[DELETE] Found user: ${user._id}, children count: ${user.children.length}`);

    // Check if the child exists
    const childExists = user.children.some((child: any) => child._id.toString() === childID);
    if (!childExists) {
      console.error(`[DELETE] Child with ID ${childID} not found in user ${normalizedClerkID}'s children`);
      return NextResponse.json({ error: "Child not found in user's children" }, { status: 404 });
    }

    // Remove the child from User's children array
    const updatedUser = await User.findOneAndUpdate(
      { clerkID: normalizedClerkID },
      { $pull: { children: { _id: new mongoose.Types.ObjectId(childID) } } },
      { new: true },
    );

    if (!updatedUser) {
      console.error(`[DELETE] Failed to update user ${normalizedClerkID} after child removal`);
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }

    // Verify child removal
    const childStillExists = updatedUser.children.some((child: any) => child._id.toString() === childID);
    if (childStillExists) {
      console.error(`[DELETE] Child ${childID} was not removed from user ${normalizedClerkID}`);
      return NextResponse.json({ error: "Failed to remove child" }, { status: 500 });
    }
    console.log(`[DELETE] Child ${childID} successfully removed from user ${normalizedClerkID}`);

    // Unregister the child from all events
    const eventUpdateResult = await Event.updateMany(
      { "registeredChildren.childId": new mongoose.Types.ObjectId(childID) },
      { $pull: { registeredChildren: { childId: new mongoose.Types.ObjectId(childID) } } },
    );
    console.log(`[DELETE] Unregistered child ${childID} from ${eventUpdateResult.modifiedCount} events`);

    // Clean up waivers
    const waiverResult = await Waiver.deleteMany({ childSubdocId: childID, isForChild: true });
    console.log(`[DELETE] Deleted ${waiverResult.deletedCount} waivers for child ${childID}`);

    return NextResponse.json({ message: "Child removed successfully" }, { status: 200 });
  } catch (error) {
    console.error(`[DELETE] Error for clerkID ${params.clerkID}, childID ${params.childID}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
