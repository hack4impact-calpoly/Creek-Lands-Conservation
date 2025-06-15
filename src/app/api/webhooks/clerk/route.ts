import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createUser } from "@/lib/users";
import { clerkClient } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import { deleteFileFromS3 } from "@/lib/s3";
import Waiver from "@/database/waiverSchema";
import User from "@/database/userSchema"; // Missing import
import Event from "@/database/eventSchema"; // Missing import

export async function deleteUserComprehensive(clerkUserId: string) {
  const session = await mongoose.startSession();

  // Arrays to store S3 files for cleanup after database transaction
  let userS3Files: string[] = [];
  let waiverS3Files: string[] = [];

  try {
    session.startTransaction();

    // Find the user to be deleted
    const user = await mongoose.model("User").findOne({ clerkID: clerkUserId }).session(session);
    if (!user) {
      console.log(`User with Clerk ID ${clerkUserId} not found`);
      return { success: true, message: "User not found" };
    }

    const userId = user._id;
    console.log(`Starting comprehensive deletion for user ${userId} (Clerk ID: ${clerkUserId})`);

    // Collect user's S3 files
    if (user.imageKey) {
      userS3Files.push(user.imageKey);
    }

    // Collect children's S3 files
    user.children.forEach((child: any) => {
      if (child.imageKey) {
        userS3Files.push(child.imageKey);
      }
    });

    // Get all waivers belonging to this user (both user and children waivers)
    const userWaivers = await Waiver.find({
      belongsToUser: userId,
    }).session(session);

    // Collect waiver S3 files
    waiverS3Files = userWaivers.map((waiver) => waiver.fileKey);

    // Get child IDs for cleanup operations
    const childIds = user.children.map((child: any) => child._id);

    // 1. Remove user and children from all event registrations
    await Event.updateMany(
      { "registeredUsers.user": userId },
      { $pull: { registeredUsers: { user: userId } } },
      { session },
    );

    await Event.updateMany(
      { "registeredChildren.childId": { $in: childIds } },
      { $pull: { registeredChildren: { childId: { $in: childIds } } } },
      { session },
    );

    // 2. Remove user's events from their registeredEvents if they were event creators
    // This assumes events have a creator/owner field - adjust if different
    const userCreatedEvents = await Event.find({
      // Add your event creator field here, e.g.:
      // createdBy: userId
    }).session(session);

    // Optional: Delete events created by this user or just remove the creator reference
    // For now, we'll just log them - you can decide the appropriate action
    if (userCreatedEvents.length > 0) {
      console.log(`User ${userId} has ${userCreatedEvents.length} created events. Consider handling these separately.`);
    }

    // 3. Delete all waivers belonging to this user
    await Waiver.deleteMany(
      {
        belongsToUser: userId,
      },
      { session },
    );

    // 4. Remove waiver references from other users/events (in case of shared waivers)
    const waiverIds = userWaivers.map((w) => w._id);
    if (waiverIds.length > 0) {
      // Remove from other users' waiversSigned arrays (if any cross-references exist)
      await User.updateMany(
        { waiversSigned: { $in: waiverIds } },
        { $pull: { waiversSigned: { $in: waiverIds } } },
        { session },
      );

      // Remove from events' waiver tracking
      await Event.updateMany(
        {
          $or: [
            { "registeredUsers.waiversSigned.waiverId": { $in: waiverIds } },
            { "registeredChildren.waiversSigned.waiverId": { $in: waiverIds } },
          ],
        },
        {
          $pull: {
            "registeredUsers.$[].waiversSigned": { waiverId: { $in: waiverIds } },
            "registeredChildren.$[].waiversSigned": { waiverId: { $in: waiverIds } },
          },
        },
        { session },
      );
    }

    // 5. Finally, delete the user document
    await User.findByIdAndDelete(userId, { session });

    await session.commitTransaction();
    console.log(`Successfully deleted user ${userId} from database`);
  } catch (error) {
    await session.abortTransaction();
    console.error("Error during user deletion transaction:", error);
    throw error;
  } finally {
    session.endSession();
  }

  // After successful database cleanup, clean up S3 files
  console.log(`Starting S3 cleanup for user ${clerkUserId}`);

  // Delete user and children image files
  const imageCleanupPromises = userS3Files.map(async (fileKey) => {
    try {
      await deleteFileFromS3(fileKey);
      console.log(`Deleted S3 user/child image: ${fileKey}`);
    } catch (s3Err) {
      console.error(`Failed to delete S3 image ${fileKey}:`, s3Err);
    }
  });

  // Delete waiver files
  const waiverCleanupPromises = waiverS3Files.map(async (fileKey) => {
    try {
      await deleteFileFromS3(fileKey);
      console.log(`Deleted S3 waiver file: ${fileKey}`);
    } catch (s3Err) {
      console.error(`Failed to delete S3 waiver file ${fileKey}:`, s3Err);
    }
  });

  // Execute all S3 cleanup operations
  await Promise.allSettled([...imageCleanupPromises, ...waiverCleanupPromises]);

  console.log(`Comprehensive user deletion completed for ${clerkUserId}`);
  return {
    success: true,
    message: "User and all related data deleted successfully",
    stats: {
      s3ImagesDeleted: userS3Files.length,
      s3WaiversDeleted: waiverS3Files.length,
    },
  };
}

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("CLERK_WEBHOOK_SECRET is not set");
    throw new Error("Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local");
  }

  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("Missing Svix headers:", { svix_id, svix_timestamp, svix_signature });
    return new Response("Error: Missing Svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error verifying webhook", { status: 400 });
  }

  const eventType = evt.type;
  console.log(`Received webhook event: ${eventType}`);

  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    if (!id || !email_addresses) {
      console.error("Missing user data:", { id, email_addresses });
      return new Response("Error: Missing user data", { status: 400 });
    }

    const role = process.env.NODE_ENV === "production" ? "user" : "admin";

    const userData = {
      clerkUserId: id,
      email: email_addresses[0].email_address,
      firstName: first_name || "",
      lastName: last_name || "",
      imageUrl: image_url || "",
      userRole: role, // Add the role here
    };

    const client = await clerkClient();

    try {
      console.log("Starting user creation process for ID:", id);

      // Update Clerk metadata
      await client.users.updateUserMetadata(id, {
        publicMetadata: { userRole: role },
      });
      console.log("Clerk metadata updated successfully for role:", role);

      // Create user in MongoDB with the role
      const user = await createUser(userData);
      if (!user || "error" in user) {
        throw new Error("Failed to create user in MongoDB");
      }
      console.log(`Created user ${id} with role '${role}' in both Clerk and MongoDB`);
      return new Response("User successfully created and role assigned", { status: 201 });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error creating user:", errorMessage);
      return new Response(`Error: Failed to create user. Details: ${errorMessage}`, { status: 500 });
    }
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;

    if (!id) {
      console.error("Missing user ID for deletion");
      return new Response("Error: Missing user ID", { status: 400 });
    }

    try {
      const result = await deleteUserComprehensive(id);
      if (!result.success) {
        throw new Error(result.message || "Failed to delete user comprehensively");
      }

      console.log(`Comprehensively deleted user ${id}:`, result.stats);
      return new Response("User and all related data successfully deleted", { status: 200 });
    } catch (err) {
      console.error("Error in comprehensive user deletion:", err);
      return new Response("Error: Failed to delete user and related data", { status: 500 });
    }
  }

  console.log(`Unhandled event type: ${eventType}`);
  return new Response("", { status: 200 });
}
