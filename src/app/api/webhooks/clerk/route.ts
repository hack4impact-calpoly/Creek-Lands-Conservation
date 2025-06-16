import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createUser } from "@/lib/users";
import { clerkClient } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import { deleteFileFromS3 } from "@/lib/s3";
import Waiver from "@/database/waiverSchema";
import User from "@/database/userSchema";
import Event from "@/database/eventSchema";

export async function deleteUserComprehensive(clerkUserId: string) {
  const session = await mongoose.startSession();

  // Arrays to store S3 files for cleanup after database transaction
  let userS3Files: string[] = [];
  let waiverS3Files: string[] = [];

  try {
    session.startTransaction();

    // Find the user to be deleted - USE IMPORTED MODEL
    const user = await User.findOne({ clerkID: clerkUserId }).session(session);
    if (!user) {
      console.log(`User with Clerk ID ${clerkUserId} not found`);
      await session.abortTransaction();
      return { success: true, message: "User not found" };
    }

    const userId = user._id;
    console.log(`Found user ${userId} with Clerk ID ${clerkUserId}`);
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
    console.log(`Found ${userWaivers.length} waivers for user ${userId}`);

    // Get child IDs for cleanup operations
    const childIds = user.children.map((child: any) => child._id);
    console.log(`Found ${childIds.length} children for user ${userId}:`, childIds);

    // 1. Remove user from event registrations
    const userEventUpdate = await Event.updateMany(
      { "registeredUsers.user": userId },
      { $pull: { registeredUsers: { user: userId } } },
      { session },
    );
    console.log(`Removed user ${userId} from ${userEventUpdate.matchedCount} events`);

    // 2. Remove children from event registrations
    if (childIds.length > 0) {
      const childEventUpdate = await Event.updateMany(
        { "registeredChildren.childId": { $in: childIds } },
        { $pull: { registeredChildren: { childId: { $in: childIds } } } },
        { session },
      );
      console.log(`Removed ${childIds.length} children from ${childEventUpdate.matchedCount} events`);
    }

    // 3. Handle events created by this user (if you have a createdBy field)
    // Uncomment and modify if you track event creators:
    /*
    const userCreatedEvents = await Event.find({
      createdBy: userId
    }).session(session);

    if (userCreatedEvents.length > 0) {
      console.log(`User ${userId} has ${userCreatedEvents.length} created events. Consider handling these separately.`);
      // Option 1: Delete events created by user
      // await Event.deleteMany({ createdBy: userId }, { session });
      
      // Option 2: Remove creator reference
      // await Event.updateMany({ createdBy: userId }, { $unset: { createdBy: 1 } }, { session });
    }
    */

    // 4. Delete all waivers belonging to this user
    if (userWaivers.length > 0) {
      const waiversDeleted = await Waiver.deleteMany({ belongsToUser: userId }, { session });
      console.log(`Deleted ${waiversDeleted.deletedCount} waivers for user ${userId}`);
    }

    // 5. Remove waiver references from other users/events
    const waiverIds = userWaivers.map((w) => w._id);
    if (waiverIds.length > 0) {
      // Remove from other users' waiversSigned arrays
      const userWaiverUpdate = await User.updateMany(
        { waiversSigned: { $in: waiverIds } },
        { $pull: { waiversSigned: { $in: waiverIds } } },
        { session },
      );
      console.log(`Removed waiver references from ${userWaiverUpdate.matchedCount} other users`);

      // Remove from events' waiver tracking - MORE SPECIFIC APPROACH
      const eventWaiverUpdate = await Event.updateMany(
        {},
        {
          $pull: {
            "registeredUsers.$[].waiversSigned": { waiverId: { $in: waiverIds } },
            "registeredChildren.$[].waiversSigned": { waiverId: { $in: waiverIds } },
          },
        },
        { session },
      );
      console.log(`Cleaned waiver references from ${eventWaiverUpdate.matchedCount} events`);

      // Also remove from event waiver templates if the user created any template waivers
      const templateWaiverUpdate = await Event.updateMany(
        { "eventWaiverTemplates.waiverId": { $in: waiverIds } },
        { $pull: { eventWaiverTemplates: { waiverId: { $in: waiverIds } } } },
        { session },
      );
      console.log(`Removed ${templateWaiverUpdate.matchedCount} waiver templates from events`);
    }

    // 6. Remove user's waiver signatures from their own profile
    const userWaiverCleanup = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          waiversSigned: [],
          registeredEvents: [],
        },
      },
      { session },
    );

    // 7. Clean up children's waiver signatures
    if (childIds.length > 0) {
      await User.updateOne(
        { _id: userId },
        {
          $set: {
            "children.$[].waiversSigned": [],
            "children.$[].registeredEvents": [],
          },
        },
        { session },
      );
    }

    // 8. Finally, delete the user document
    const deletedUser = await User.findByIdAndDelete(userId, { session });
    if (!deletedUser) {
      throw new Error(`Failed to delete user ${userId}`);
    }
    console.log(`Successfully deleted user document ${userId}`);

    await session.commitTransaction();
    console.log(`Successfully completed database transaction for user ${userId}`);
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
      return { success: true, fileKey };
    } catch (s3Err) {
      console.error(`Failed to delete S3 image ${fileKey}:`, s3Err);
      return { success: false, fileKey, error: s3Err };
    }
  });

  // Delete waiver files
  const waiverCleanupPromises = waiverS3Files.map(async (fileKey) => {
    try {
      await deleteFileFromS3(fileKey);
      console.log(`Deleted S3 waiver file: ${fileKey}`);
      return { success: true, fileKey };
    } catch (s3Err) {
      console.error(`Failed to delete S3 waiver file ${fileKey}:`, s3Err);
      return { success: false, fileKey, error: s3Err };
    }
  });

  // Execute all S3 cleanup operations
  const s3Results = await Promise.allSettled([...imageCleanupPromises, ...waiverCleanupPromises]);

  const s3Stats = {
    totalAttempted: s3Results.length,
    successful: s3Results.filter((r) => r.status === "fulfilled").length,
    failed: s3Results.filter((r) => r.status === "rejected").length,
  };

  console.log("S3 cleanup completed:", s3Stats);
  console.log(`Comprehensive user deletion completed for ${clerkUserId}`);

  return {
    success: true,
    message: "User and all related data deleted successfully",
    stats: {
      s3ImagesAttempted: userS3Files.length,
      s3WaiversAttempted: waiverS3Files.length,
      s3CleanupStats: s3Stats,
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
      userRole: role,
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
