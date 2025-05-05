"use client";

import { useEffect, useState } from "react";
import WaiverSignatureComponent from "@/components/WaiverSignatureComponent/WaiverSignatureComponent";
import { useUser } from "@clerk/nextjs";
import WaiverSignatureSkeleton from "@/components/WaiverSignatureComponent/WaiverSignatureSkeleton";
import { getSignedWaiversForRegisteredEvents } from "@/app/actions/waivers/action";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// Interface for the full waiver document returned by the server action
interface FullSignedWaiver {
  waiver: {
    _id: string;
    fileKey: string;
    uploadedAt: Date;
    isForChild: boolean;
    childSubdocId?: string;
    eventId: string;
  };
  event: { title: string; startDate: string; endDate: string };
  childName?: string;
}

// Interface expected by WaiverSignatureComponent
interface RegisteredEvent {
  id: string;
  eventName: string;
  startDateTime: Date;
  endDateTime: Date;
  signatureDate: Date;
  fileKey: string; // Add fileKey to use in handleViewWaiver
}

export default function WaiversPage() {
  const [registeredEvents, setRegisteredEvents] = useState<RegisteredEvent[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentWaiverUrl, setCurrentWaiverUrl] = useState<string | null>(null);
  const { isLoaded, user } = useUser();

  useEffect(() => {
    const fetchSignedWaiversData = async () => {
      try {
        if (!isLoaded || !user) return;

        // Fetch user data to get MongoDB _id
        const userResponse = await fetch(`/api/users/${user.id}`, {
          method: "GET",
        });
        if (!userResponse.ok) throw new Error("Failed to fetch user data");
        const userData = await userResponse.json();
        if (!userData?._id) throw new Error("User not Found in MongoDB");

        // Fetch signed waivers using the server action
        const signedWaivers: FullSignedWaiver[] = await getSignedWaiversForRegisteredEvents(userData._id);

        // Map waivers to RegisteredEvent interface
        const registeredEvents: RegisteredEvent[] = signedWaivers.map((signedWaiver) => ({
          id: signedWaiver.waiver._id,
          eventName: signedWaiver.waiver.isForChild ? `${signedWaiver.event.title}` : signedWaiver.event.title,
          startDateTime: new Date(signedWaiver.event.startDate),
          endDateTime: new Date(signedWaiver.event.endDate),
          signatureDate: new Date(signedWaiver.waiver.uploadedAt),
          fileKey: signedWaiver.waiver.fileKey, // Store fileKey for fetching presigned URL
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

  const handleViewWaiver = async (fileKey: string) => {
    try {
      console.log("Fetching presigned URL for fileKey:", fileKey);

      // Fetch the presigned URL using the fileKey from /api/s3/presigned-download
      const presignedResponse = await fetch(`/api/s3/presigned-download?fileKey=${encodeURIComponent(fileKey)}`, {
        method: "GET",
      });
      if (!presignedResponse.ok) {
        const errorData = await presignedResponse.json();
        throw new Error(errorData.error || "Failed to fetch presigned URL");
      }
      const presignedData = await presignedResponse.json();

      // Set the presigned URL and open the dialog
      setCurrentWaiverUrl(presignedData.url);
      setIsDialogOpen(true);
    } catch (error: any) {
      console.error("Failed to view waiver:", error);
      setError(error.message || "Failed to load waiver");
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

  if (error) return <p className="text-red-500">{error}</p>;

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
              signed={true}
              signatureDate={event.signatureDate}
              onViewWaiver={() => handleViewWaiver(event.fileKey)} // Pass fileKey directly
            />
          ))
        )}
      </div>

      {/* Shadcn/UI Dialog for waiver preview */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Waiver Preview</DialogTitle>
            <DialogDescription>View the signed waiver below.</DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {currentWaiverUrl ? (
              <iframe src={currentWaiverUrl} title="Waiver Preview" className="h-[80vh] w-full border-none" />
            ) : (
              <p>Loading...</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
