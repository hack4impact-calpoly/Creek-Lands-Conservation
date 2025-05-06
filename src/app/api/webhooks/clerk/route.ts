// app/api/webhooks/clerk/route.ts

import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createUser, deleteUser } from "@/lib/users";
import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

export const config = {
  api: {
    bodyParser: false, // disables body parsing for App Router (Vercel needs raw body for Clerk)
  },
};

export async function POST(req: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("CLERK_WEBHOOK_SECRET is not set");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("Missing Svix headers:", { svix_id, svix_timestamp, svix_signature });
    return new Response("Error: Missing Svix headers", { status: 400 });
  }

  const rawBody = await req.text(); // ✅ Get raw body as text
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;
  try {
    evt = wh.verify(rawBody, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("❌ Webhook verification failed:", err);
    return new Response("Error verifying webhook", { status: 400 });
  }

  const eventType = evt.type;
  console.log(`📩 Received webhook event: ${eventType}`);

  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    if (!id || !email_addresses?.length) {
      console.error("Missing user data:", { id, email_addresses });
      return new Response("Error: Missing user data", { status: 400 });
    }

    const userData = {
      clerkUserId: id,
      email: email_addresses[0].email_address,
      firstName: first_name || "",
      lastName: last_name || "",
      imageUrl: image_url || "",
    };

    const role = process.env.NODE_ENV === "production" ? "user" : "admin";

    try {
      console.log("👤 Creating user in MongoDB and assigning role:", role);

      await clerkClient.users.updateUserMetadata(id, {
        publicMetadata: { userRole: role },
      });

      const user = await createUser(userData);
      if (!user || "error" in user) {
        throw new Error("Failed to create user in MongoDB");
      }

      console.log(`✅ Created user ${id} with role '${role}'`);
      return new Response("User successfully created and role assigned", { status: 201 });
    } catch (err) {
      console.error("❌ Error creating user:", err);
      return new Response("Error creating user", { status: 500 });
    }
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;

    if (!id) {
      console.error("Missing user ID for deletion");
      return new Response("Error: Missing user ID", { status: 400 });
    }

    try {
      const result = await deleteUser(id);
      if (result.error) {
        throw new Error(result.error);
      }
      console.log(`🗑️ Deleted user ${id}`);
      return new Response("User successfully deleted", { status: 200 });
    } catch (err) {
      console.error("❌ Error deleting user:", err);
      return new Response("Error deleting user", { status: 500 });
    }
  }

  console.log(`⚠️ Unhandled event type: ${eventType}`);
  return new Response("Unhandled event type", { status: 200 });
}
