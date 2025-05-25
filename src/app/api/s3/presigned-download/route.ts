import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "@/lib/s3";
import { getAuth } from "@clerk/nextjs/server";
import { authenticateAdmin } from "@/lib/auth";
import User from "@/database/userSchema";
import Event from "@/database/eventSchema";
import Waiver from "@/database/waiverSchema";
import { RawRegisteredUser, RawRegisteredChild, RawUser } from "@/types/events";

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fileKey = searchParams.get("fileKey");
  if (!fileKey) {
    return NextResponse.json({ error: "Missing fileKey" }, { status: 400 });
  }

  const isAdmin = await authenticateAdmin();
  const user = await User.findOne({ clerkID: userId });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Authorization checks based on file type
  if (fileKey.startsWith("event-images/")) {
    const parts = fileKey.split("/");
    if (parts.length < 3) {
      return NextResponse.json({ error: "Invalid fileKey" }, { status: 400 });
    }
    const eventId = parts[1];
    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    // Allow access to published events for all users (already implemented)
    if (!event.isDraft) {
    } else {
      const isRegistered =
        event.registeredUsers.some((u: RawRegisteredUser) => {
          if (typeof u.user === "object" && "_id" in u.user) {
            const userObj = u.user as RawUser;
            return userObj._id === user._id.toString();
          } else if (typeof u.user === "string") {
            return u.user === user._id.toString();
          }
          return false;
        }) ||
        event.registeredChildren.some((c: RawRegisteredChild) => {
          if (typeof c.parent === "object" && "_id" in c.parent) {
            const parentObj = c.parent as RawUser;
            return parentObj._id === user._id.toString();
          } else if (typeof c.parent === "string") {
            return c.parent === user._id.toString();
          }
          return false;
        });
      if (!isRegistered && !isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
  } else if (fileKey.startsWith("user-profiles/")) {
    const profileClerkId = fileKey.split("/")[1];
    if (profileClerkId !== userId && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (fileKey.startsWith("waivers/completed/")) {
    const waiver = await Waiver.findOne({ fileKey });
    if (!waiver || (!waiver.belongsToUser.equals(user._id) && !isAdmin)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (fileKey.startsWith("waivers/templates/")) {
    // No restriction needed — all logged-in users can view
  } else {
    return NextResponse.json({ error: "Invalid fileKey" }, { status: 403 });
  }

  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: fileKey,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 300 });
  return NextResponse.json({ url });
}
