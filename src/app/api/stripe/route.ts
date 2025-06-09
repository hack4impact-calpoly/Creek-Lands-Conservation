import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  console.log("POST request to /api/stripe");
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      throw new Error("Missing STRIPE_SECRET_KEY in environment variables.");
    }
    const stripe = new Stripe(stripeSecretKey);

    const origin = req.headers.get("origin");
    const { title, fee, quantity, eventId, attendees, userId } = await req.json();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: title,
            },
            unit_amount: fee,
          },
          quantity: quantity,
        },
      ],
      mode: "payment",
      success_url: `${origin}/events/${eventId}`,
      cancel_url: `${origin}/events/${eventId}`,
      metadata: {
        eventId: eventId,
        attendees: JSON.stringify(attendees),
        userId: userId,
        url: origin,
      },
    });

    return NextResponse.json({ sessionUrl: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
