import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createUser, deleteUser } from "@/lib/users";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local");
  }

  // Extract headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing Svix headers", { status: 400 });
  }

  // Get request body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Verify the webhook
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

  // Extract event type
  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    if (!id || !email_addresses) {
      return new Response("Error: Missing user data", { status: 400 });
    }

    const userData = {
      clerkUserId: id,
      email: email_addresses[0].email_address,
      firstName: first_name || "",
      lastName: last_name || "",
      imageUrl: image_url || "",
    };

    // Change this to user in production
    let role = "admin";
    const client = await clerkClient();

    try {
      await client.users.updateUserMetadata(id, {
        publicMetadata: { userRole: role },
      });
      // Create the user in MongoDB
      await createUser(userData);
      console.log(`Created user ${id} with role '${role}'`);
      return new Response("User successfully created and role assigned", { status: 201 });
    } catch (err) {
      console.error("Error updating metadata or creating user:", err);
      return new Response("Error: Failed to update metadata and create user", { status: 500 });
    }
  }

  // Handle user deletion
  if (eventType === "user.deleted") {
    const { id } = evt.data;

    if (!id) {
      return new Response("Error: Missing user ID", { status: 400 });
    }

    try {
      await deleteUser(id);
      console.log(`Deleted user ${id}`);
      return new Response("User successfully deleted", { status: 200 });
    } catch (err) {
      console.error("Error deleting user:", err);
      return new Response("Error: Failed to delete user", { status: 500 });
    }
  }

  return new Response("", { status: 200 });
}
