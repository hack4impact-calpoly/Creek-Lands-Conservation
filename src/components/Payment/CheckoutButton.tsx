"use client";

import { Button } from "@/components/ui/button";

const CheckoutButton = () => {
  // Replace with your actual event data
  // adjust fee based on number of attendees
  const eventData = {
    title: "Event Title",
    description: "Event Description", // change to the start date
    fee: 1000, // Fee in cents
    attendees: 2, // Number of attendees
    // add a return url for back button
    // add a redirect url for successful payment
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
