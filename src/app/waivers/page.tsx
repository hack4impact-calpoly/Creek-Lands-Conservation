"use client";

import { useEffect, useState } from "react";
import WaiverSignatureComponent from "@/components/WaiverSignatureComponent/WaiverSignatureComponent";
import { useUser } from "@clerk/nextjs";
import WaiverSignatureSkeleton from "@/components/WaiverSignatureComponent/WaiverSignatureSkeleton";
import { getSignedWaiversForRegisteredEvents } from "@/app/actions/waivers/action";

// Interface for the data returned by the server action
interface SignedWaiver {
  waiverId: string;
  event: { title: string; startDate: string; endDate: string };
  uploadedAt: string;
  isForChild: boolean;
  childName?: string;
}

// Interface expected by WaiverSignatureComponent
interface RegisteredEvent {
  id: string;
  eventName: string;
  startDateTime: Date;
  endDateTime: Date;
  signatureDate: Date;
  waiverId: string;
}

export default function WaiversPage() {
  const [registeredEvents, setRegisteredEvents] = useState<RegisteredEvent[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isLoaded, user } = useUser();

  useEffect(() => {
    const fetchSignedWaiversData = async () => {
      try {
        if (!isLoaded || !user) return;

        // Fetch user data to get MongoDB _id
        const userResponse = await fetch(`/api/users/${user.id}`);
        if (!userResponse.ok) throw new Error("Failed to fetch user data");
        const userData = await userResponse.json();
        if (!userData?._id) throw new Error("User not Found in MongoDB");
        console.log("User data:", userData);
        console.log("User ID:", userData._id);

        // Fetch signed waivers using the new server action
        const signedWaivers: SignedWaiver[] = await getSignedWaiversForRegisteredEvents(userData._id);
        console.log("Fetched signed waivers:", signedWaivers);

        // Map waivers to RegisteredEvent interface
        const registeredEvents: RegisteredEvent[] = signedWaivers.map((waiver) => ({
          id: waiver.waiverId,
          eventName: waiver.isForChild ? `${waiver.event.title}` : waiver.event.title,
          startDateTime: new Date(waiver.event.startDate),
          endDateTime: new Date(waiver.event.endDate),
          signatureDate: new Date(waiver.uploadedAt),
          waiverId: waiver.waiverId,
        }));

        setRegisteredEvents(registeredEvents);
      } catch (error: any) {
        console.error("Failed to fetch signed waivers:", error);
        setError(error.message || "Failed to load waivers");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSignedWaiversData();
  }, [isLoaded, user]);

  const handleViewWaiver = async (waiverId: string) => {
    try {
      window.open(`/api/waivers/${waiverId}`, "_blank");
    } catch (error) {
      console.error("Failed to view waiver:", error);
    }
  };

  if (isLoading || !isLoaded || !user || registeredEvents === null) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="mb-6 text-4xl">Past Signed Waivers</h1>
        <div className="flex flex-col gap-4">
          {[...Array(3)].map((_, idx) => (
            <WaiverSignatureSkeleton key={idx} />
          ))}
        </div>
      </div>
    );
  }

  if (error) return <p>{error}</p>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-4xl">Past Signed Waivers</h1>

      <div className="flex flex-col gap-4">
        {registeredEvents.length === 0 && !isLoading ? (
          <div className="rounded-lg bg-gray-100 p-6 text-center text-gray-500">No signed waivers found</div>
        ) : (
          registeredEvents.map((event) => (
            <WaiverSignatureComponent
              key={event.id}
              eventName={event.eventName}
              startDateTime={event.startDateTime}
              endDateTime={event.endDateTime}
              signed={true} // All waivers on this page are signed
              signatureDate={event.signatureDate}
              onViewWaiver={() => handleViewWaiver(event.waiverId)}
            />
          ))
        )}
      </div>
    </div>
  );
}
