import Stripe from "stripe";
import { headers } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;

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
    const session = event.data.object as Stripe.Checkout.Session;
    const eventId = session.metadata?.eventId;
    const attendeesRaw = session.metadata?.attendees;
    console.log("attendees", attendeesRaw);

    try {
      if (!attendeesRaw) {
        return new Response("Missing attendees metadata", { status: 400 });
      }

      let attendeesPayload: { attendees: string[] };

      try {
        attendeesPayload = JSON.parse(attendeesRaw);
      } catch (err) {
        console.error("Error parsing attendees metadata:", err);
        return new Response("Invalid attendees JSON format", { status: 400 });
      }

      if (!attendeesPayload.attendees || !Array.isArray(attendeesPayload.attendees)) {
        console.error("Invalid attendees array format:", attendeesPayload);
        return new Response("Invalid attendees format", { status: 400 });
      }

      console.log("Parsed attendees:", attendeesPayload.attendees);

      const response = await fetch(`https://golden-oryx-evidently.ngrok-free.app/api/events/${eventId}/registrations`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attendeesPayload),
      });

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
