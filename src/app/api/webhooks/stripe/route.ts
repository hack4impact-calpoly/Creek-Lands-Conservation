import Stripe from "stripe";
import { headers } from "next/headers";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY in environment variables.");
}

const stripe = new Stripe(stripeSecretKey);
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("stripe-signature") as string;

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add STRIPE_WEBHOOK_SECRET from Stripe Dashboard to .env or .env.local");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch (err) {
    return new Response(`Webhook Error: ${err}`, { status: 400 });
  }

  // check if stripe payment is successful
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const eventId = session.metadata?.eventId;
    const attendeesRaw = session.metadata?.attendees;
    const userId = session.metadata?.userId;
    const url = session.metadata?.url;

    if (!userId) {
      return new Response("Missing userId metadata", { status: 400 });
    }

    try {
      if (!attendeesRaw) {
        return new Response("Missing attendees metadata", { status: 400 });
      }

      const attendeesPayload = JSON.parse(attendeesRaw);

      const response = await fetch(
        `${url}/api/events/${eventId}/registrations/stripe`, // this should be changed to the deployment url
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userId, attendees: attendeesPayload }),
          credentials: "include",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        console.error("Failed to register:", result);
        return new Response("Failed to register", { status: 500 });
      }

      return new Response(JSON.stringify({ received: true }), { status: 200 });
    } catch (err) {
      console.error("Registration error:", err);
      return new Response("Failed to register", { status: 500 });
    }
  }
  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
