"use client";

import { Button } from "@/components/ui/button";
import { StringExpression } from "mongoose";
import { start } from "repl";

interface CheckoutButtonProps {
  title: string;
  startDate: string;
  fee: number;
  attendees: number;
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
    attendees: attendees,
    eventId: eventId,
  };

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
    <Button onClick={handleCheckout} className="mx-auto w-full bg-[#488644] text-white hover:bg-[#3a6d37] sm:w-2/5">
      Register and Pay for Event
    </Button>
  );
};

export default CheckoutButton;
