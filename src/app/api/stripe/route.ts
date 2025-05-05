import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const origin = req.headers.get("origin");
    const { title, description, fee, attendees, eventId } = await req.json();

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
          quantity: attendees,
        },
      ],
      mode: "payment",
      success_url: `${origin}/${eventId}`,
      cancel_url: `${origin}/${eventId}`,
    });

    return NextResponse.json({ sessionUrl: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
