import connectDB from "@/database/db";
import Event from "@/database/eventSchema";
import Waiver from "@/database/waiverSchema";
import { NextRequest, NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: { eventID: string } }) {
  try {
    await connectDB();

    const authError = await authenticateAdmin();
    if (authError !== true) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const childId = searchParams.get("childId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Build the query based on whether it's for a child or user
    const query: any = {
      belongsToUser: userId,
      eventId: params.eventID,
      type: "completed",
    };

    // If childId is provided, it's for a child waiver
    if (childId) {
      query.isForChild = true;
      query.childSubdocId = childId;
    } else {
      query.isForChild = false;
    }

    // Find waivers and populate event information
    const waivers = await Waiver.find(query)
      .populate({
        path: "eventId",
        select: "title",
        model: Event,
      })
      .sort({ uploadedAt: -1 });

    // Format the response
    const formattedWaivers = waivers.map((waiver: any) => ({
      _id: waiver._id,
      fileKey: waiver.fileKey,
      fileName: waiver.fileName,
      uploadedAt: waiver.uploadedAt,
      eventTitle: waiver.eventId?.title || "Unknown Event",
    }));

    return NextResponse.json(formattedWaivers);
  } catch (error) {
    console.error("Error fetching waivers:", error);
    return NextResponse.json({ error: "Failed to fetch waivers" }, { status: 500 });
  }
}
