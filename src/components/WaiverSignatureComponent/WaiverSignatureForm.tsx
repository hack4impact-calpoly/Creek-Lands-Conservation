"use client";
import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import SignatureCanvas from "./SignatureCanvas";

type Participant = {
  firstName: string;
  lastName: string;
  userID: string;
  isChild: boolean;
};

type Waiver = {
  _id: string;
  fileKey: string;
};

type WaiverSignatureFormProps = {
  eventId: string;
  participants: Participant[];
  onAllSigned: () => void;
};

export default function WaiverSignatureForm({ eventId, participants, onAllSigned }: WaiverSignatureFormProps) {
  const [waivers, setWaivers] = useState<Waiver[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [waiverUrl, setWaiverUrl] = useState("");
  const [signed, setSigned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showError, setShowError] = useState(false);
  const [waiversFetched, setWaiversFetched] = useState(false);

  // Fetch waivers for the event
  useEffect(() => {
    const fetchWaivers = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/waivers`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch waivers.");
        setWaivers(data.waivers);
      } catch (err) {
        console.error("Error fetching waivers:", err);
      } finally {
        setWaiversFetched(true);
      }
    };
    fetchWaivers();
  }, [eventId]);

  // Fetch S3 presigned URL for current waiver
  useEffect(() => {
    const fetchWaiverUrl = async () => {
      if (waivers.length === 0 || !waivers[currentIndex]) return;
      setLoading(true);
      try {
        const fileKey = waivers[currentIndex].fileKey;
        const res = await fetch(`/api/s3/presigned-download?fileKey=${encodeURIComponent(fileKey)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to get presigned URL.");
        setWaiverUrl(data.url);
      } catch (err) {
        console.error("Error fetching waiver URL:", err);
        setWaiverUrl("");
      } finally {
        setLoading(false);
      }
    };
    fetchWaiverUrl();
  }, [waivers, currentIndex]);

  useEffect(() => {
    // if there happens to be no waivers for this event.
    if (waiversFetched && waivers.length === 0) {
      (async () => {
        try {
          await fetch(`/api/events/${eventId}/registrations`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              attendees: participants.map((p) => p.userID),
            }),
          });
        } catch (err) {
          console.error("Registration failed (no waivers):", err);
        } finally {
          onAllSigned();
        }
      })();
    }
  }, [waiversFetched, waivers, eventId, participants, onAllSigned]);

  // Reset state when switching waivers
  useEffect(() => {
    setSigned(false);
    setAgreedToTerms(false);
    setShowError(false);
  }, [currentIndex]);

  const onSubmit = async () => {
    if (!agreedToTerms) {
      setShowError(true);
      return;
    }
    if (!signed) {
      // TODO: this needs some server side error handling
      // registration endpoint should somehow check for signature.
      return;
    }

    if (currentIndex < waivers.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // this is the last page when everything is signed
      // TODO: I really would like a better place to put this
      try {
        await fetch(`/api/events/${eventId}/registrations`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attendees: participants.map((p) => p.userID),
          }),
        });
      } catch (err) {
        console.error("Registration failed:", err);
        // optionally show toast or fallback
      }

      // Going to assume this is some type of redirect to the payment portal.
      onAllSigned();
    }
  };

  const currentWaiver = waivers[currentIndex];

  if (loading || !waiversFetched) {
    return <p className="mt-12 text-center text-gray-600">Loading waiver...</p>;
  }
  if (waivers.length === 0) {
    return <p className="mt-12 text-center text-gray-600">No waivers required. Completing registration...</p>;
  }

  return (
    <div className="mx-auto mb-10 flex max-w-[960px] flex-col items-center px-6">
      <h1 className="mb-6 mr-auto mt-4 text-2xl font-semibold">Waiver and Liability Agreement</h1>

      <iframe src={waiverUrl} className="min-h-[600px] w-full rounded border" title="Waiver Preview" loading="lazy" />

      <div className="my-8 w-full space-y-6">
        <div>
          <div className="flex items-start gap-2">
            <Checkbox
              id="agreedToTerms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => {
                setAgreedToTerms(!!checked);
                setShowError(false);
              }}
            />
            <label htmlFor="agreedToTerms" className="text-sm font-bold leading-5">
              By checking this box, I agree to the terms of service stated above.
            </label>
          </div>
          {showError && (
            <p className="text-xs text-red-500 sm:text-sm">You must agree to the terms before continuing.</p>
          )}
        </div>

        <div className="mb-2">
          <p className="text-sm font-bold leading-5">You are signing for the following participants:</p>
          <div className="mt-2 flex flex-wrap gap-12 text-sm">
            {participants.map((p) => (
              <span key={p.userID}>
                {p.firstName} {p.lastName}
              </span>
            ))}
          </div>
        </div>

        {!signed && (
          <div className="flex justify-center">
            <SignatureCanvas
              eventId={eventId}
              waiverId={currentWaiver._id}
              fileKey={currentWaiver.fileKey}
              participants={participants}
              onSigned={() => setSigned(true)}
            />
          </div>
        )}

        {signed && <p className="flex justify-center text-sm italic text-green-600">Signed Successfully!</p>}

        <div className="flex justify-center">
          <Button
            type="button"
            onClick={onSubmit}
            className="bg-[#488644] text-white hover:bg-[#3a6d37]"
            disabled={!signed || !waiverUrl}
          >
            {currentIndex === waivers.length - 1 ? "Complete Registration" : "Next Waiver"} <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
