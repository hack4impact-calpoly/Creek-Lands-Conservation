"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import WaiverSignatureForm from "@/components/WaiverSignatureComponent/WaiverSignatureForm";
import { toast } from "@/hooks/use-toast";

type Participant = {
  firstName: string;
  lastName: string;
  userID: string;
  isChild: boolean;
};

export default function WaiverSignPage({ params }: { params: { eventId: string } }) {
  const router = useRouter();
  const [participants, setParticipants] = useState<Participant[] | null>(null);

  useEffect(() => {
    try {
      // using localstorage to avoid huge query strings in the URL.
      const stored = localStorage.getItem("waiverParticipants");
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
  }, [router]);

  const handleAllSigned = () => {
    localStorage.removeItem("waiverParticipants");
    toast({
      title: "Registration Complete",
      description: "You have successfully signed all waivers and registered.",
    });
    router.push("/");
  };

  return participants ? (
    <WaiverSignatureForm eventId={params.eventId} participants={participants} onAllSigned={handleAllSigned} />
  ) : (
    <div className="p-8 text-center text-gray-600">Loading waiver form...</div>
  );
}
