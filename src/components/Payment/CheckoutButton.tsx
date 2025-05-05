"use client";

import { Attendee } from "@/app/[eventID]/page";
import { Button } from "@/components/ui/button";
import { StringExpression } from "mongoose";
import { start } from "repl";

interface CheckoutButtonProps {
  title: string;
  startDate: string;
  fee: number;
  attendees: Attendee[];
  eventId: string;
}

const CheckoutButton = ({ title, startDate, fee, attendees, eventId }: CheckoutButtonProps) => {
  fee = Math.round(fee * 100); // Convert to cents
  const eventData = {
    title: title,
    description: new Date(startDate).toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
    fee: fee, // Fee in cents
    quantity: attendees.length,
    eventId: eventId,
    attendees: attendees.map((attendee) => attendee.userID), // only pass userID
  };

  console.log(attendees.map((attendee) => attendee.userID));

  const handleCheckout = async () => {
    const res = await fetch("/api/stripe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventData),
    });

    const data = await res.json();
    if (data.sessionUrl) {
      window.location.href = data.sessionUrl;
    } else {
      console.error("Stripe error:", data.error);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      className="mx-auto mb-10 w-full bg-[#488644] text-white hover:bg-[#3a6d37] sm:w-2/5"
    >
      Register and Pay for Event
    </Button>
  );
};

export default CheckoutButton;
