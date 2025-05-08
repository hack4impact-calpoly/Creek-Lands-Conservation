import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const origin = req.headers.get("origin");
    const { title, description, fee, quantity, eventId, attendees, clerkId } = await req.json();
    // including clerkid in the metadata might introduce security issues
    // investigate storing stripe checkout session id in db - link to user
    // and using that to verity the user in the webhook

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: title,
              description: description,
            },
            unit_amount: fee,
          },
          quantity: quantity,
        },
      ],
      mode: "payment",
      success_url: `${origin}/${eventId}/success`,
      cancel_url: `${origin}/${eventId}`,
      metadata: {
        eventId: eventId,
        attendees: JSON.stringify({ attendees }),
        clerkId: clerkId,
      },
    });

    console.log("Stripe session created:", session);

    return NextResponse.json({ sessionUrl: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
