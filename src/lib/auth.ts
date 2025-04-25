import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Event from "@/database/eventSchema";
import User from "@/database/userSchema";

export async function authenticateAdmin(): Promise<boolean> {
  const { userId, sessionClaims } = await auth();
  const role = sessionClaims?.metadata?.userRole;

  if (!userId || role !== "admin") {
    return false;
  }

  return role === "admin";
}

async function checkUserCanAccessEvent(userId: string, eventId: string): Promise<boolean> {
  const event = await Event.findById(eventId);
  if (!event) return false;
  if (event.isDraft) return await authenticateAdmin(); // Only admins for drafts
  const userObjId = (await User.findOne({ clerkID: userId }))?._id;
  return (
    event.registeredUsers.some((u: any) => u.user.equals(userObjId)) ||
    event.registeredChildren.some((c: any) => c.parent.equals(userObjId)) ||
    (await authenticateAdmin())
  );
}
