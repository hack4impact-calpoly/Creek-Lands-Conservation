import Stripe from "stripe";
import { headers } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  console.log("Received Stripe webhook");
  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;
  console.log("Signature:", signature);

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add STRIPE_WEBHOOK_SECRET from Stripe Dashboard to .env or .env.local");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch (err) {
    return new Response(`Webhook Error: ${err}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    console.log("Payment succeeded");
    const session = event.data.object as Stripe.Checkout.Session;
    const eventId = session.metadata?.eventId;
    const attendeesRaw = session.metadata?.attendees;

    try {
      const response = await fetch(`${process.env.BASE_URL}/api/events/${eventId}/registrations`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: attendeesRaw,
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Failed to register:", result);
        return new Response("Failed to register", { status: 500 });
      }

      console.log("Successfully registered attendees");
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    } catch (err) {
      console.error("Registration error:", err);
      return new Response("Failed to register", { status: 500 });
    }
  }
}
