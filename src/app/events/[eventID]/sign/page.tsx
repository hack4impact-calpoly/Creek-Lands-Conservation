"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import WaiverSignatureForm from "@/components/WaiverSignatureComponent/WaiverSignatureForm";
import { toast } from "@/hooks/use-toast";
import WaiverSignatureFormSkeleton from "@/components/WaiverSignatureComponent/WaiverSignatureFormSkeleton";

type Participant = {
  firstName: string;
  lastName: string;
  userID: string;
  isChild: boolean;
};

export default function WaiverSignPage({ params }: { params: { eventID: string } }) {
  const router = useRouter();
  const [participants, setParticipants] = useState<Participant[] | null>(null);
  const [fee, setFee] = useState<number | null>(null);
  const [eventTitle, setEventTitle] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    try {
      // using localstorage to avoid huge query strings in the URL.
      const stored = localStorage.getItem("waiverParticipants");
      console.log("Stored participants:", stored);
      if (!stored) {
        router.push("/"); // fallback to home if no data
        return;
      }
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) throw new Error("Invalid participant data");

      setParticipants(parsed);
    } catch (error) {
      console.error("Failed to load participants from localStorage:", error);
      router.push("/"); // fallback again
    }

    try {
      const eventFee = localStorage.getItem("eventFee");
      const eventTitle = localStorage.getItem("eventTitle");
      const id = localStorage.getItem("userId");

      setFee(eventFee ? parseFloat(eventFee) : null);
      setEventTitle(eventTitle);
      setUserId(id);
    } catch (error) {
      console.log("no fee, title, or userId in localStorage, this is fine if the event doesn't require payment");
    }
  }, [router]);

  const handleAllSigned = () => {
    localStorage.removeItem("waiverParticipants");
    localStorage.removeItem("eventFee");
    toast({
      title: "Registration Complete",
      description: "You have successfully signed all waivers and registered.",
    });
    router.push("/");
  };

  const handlePayment = async () => {
    localStorage.removeItem("waiverParticipants");
    localStorage.removeItem("eventFee");
    localStorage.removeItem("eventTitle");
    localStorage.removeItem("userId");

    try {
      const parsedFee = Math.round(fee ? fee * 100 : 0); // Convert to cents
      const eventData = {
        title: eventTitle,
        fee: parsedFee, // Fee in cents
        quantity: participants?.length,
        eventId: params.eventID,
        attendees: participants?.map((participants) => participants.userID), // only pass userID
        userId: userId,
      };

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
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Error",
        description: "There was an error processing your payment. Please try again later.",
        variant: "destructive",
      });
    }
  };

  return participants ? (
    <WaiverSignatureForm
      eventId={params.eventID}
      participants={participants}
      fee={fee || 0}
      onAllSigned={fee === 0 ? handleAllSigned : handlePayment}
    />
  ) : (
    <WaiverSignatureFormSkeleton />
  );
}
