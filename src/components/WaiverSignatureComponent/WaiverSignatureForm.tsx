// src/components/WaiverSignatureComponent/WaiverSignatureForm.tsx
"use client";

import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronRight, ExternalLink, FileText } from "lucide-react";
import SignatureCanvas from "./SignatureCanvas";
import WaiverSignatureFormSkeleton from "./WaiverSignatureFormSkeleton";
import { useRouter } from "next/navigation";
import useMobileDetection from "@/hooks/useMobileDetection";

// TODO: currently, if there is multiple waivers, the user can sign the first one and that document will be generated in s3 and mongodb, even if they decided to not sign up, we only want to save user documents when users confirms signup

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
  const router = useRouter();
  const [hasViewedWaiver, setHasViewedWaiver] = useState(false);

  const isMobile = useMobileDetection();

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
        setLoading(false);
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

  // Reset state when switching waivers
  useEffect(() => {
    setSigned(false);
    setAgreedToTerms(false);
    setShowError(false);
    setHasViewedWaiver(false);
  }, [currentIndex]);

  const handleViewWaiver = () => {
    if (waiverUrl) {
      window.open(waiverUrl, "_blank", "noopener,noreferrer");
      setHasViewedWaiver(true);
    }
  };

  const onSubmit = async () => {
    if (!agreedToTerms) {
      setShowError(true);
      return;
    }
    if (!signed) {
      // TODO: Add server-side signature validation
      return;
    }

    if (currentIndex < waivers.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      try {
        const res = await fetch(`/api/events/${eventId}/registrations`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attendees: participants.map((p) => p.userID),
          }),
        });

        if (res.status === 409) {
          const data = await res.json();
          console.error("Profile incomplete:", data.error);
          localStorage.setItem("showProfileIncompleteToast", "true");

          router.push("/user");
          return;
        }

        onAllSigned();
      } catch (err) {
        console.error("Registration failed:", err);
        // Optionally show toast or fallback
      }
    }
  };

  const currentWaiver = waivers[currentIndex];

  // Show skeleton while loading
  if (loading) {
    return <WaiverSignatureFormSkeleton />;
  }

  return (
    <div className="mx-auto mb-10 flex max-w-[960px] flex-col items-center px-4 sm:px-6">
      <h1 className="mb-6 mr-auto mt-4 text-xl font-semibold sm:text-2xl">Waiver and Liability Agreement</h1>

      {/* Desktop iframe view */}
      {!isMobile && (
        <iframe
          src={waiverUrl}
          className="min-h-[600px] w-full rounded border"
          title="Waiver Preview"
          loading="lazy"
          style={{
            overflow: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        />
      )}

      {/* Mobile fallback view */}
      {isMobile && (
        <div className="flex min-h-[350px] w-full flex-col items-center justify-center space-y-3 rounded border bg-gradient-to-br from-gray-50 to-gray-100 p-4">
          <div className="mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
            <FileText className="h-7 w-7 text-blue-600" />
          </div>

          <div className="space-y-2 text-center">
            <h3 className="text-base font-semibold text-gray-800">View Waiver Document</h3>
            <p className="px-2 text-sm text-gray-600">
              For the best viewing experience on mobile devices, please open the waiver document in a new tab.
            </p>
            {hasViewedWaiver && <p className="text-xs font-medium text-green-600">✓ Document opened successfully</p>}
          </div>

          <Button
            type="button"
            onClick={handleViewWaiver}
            variant="outline"
            className="flex items-center gap-2 border-2 bg-white px-4 py-2 text-sm hover:bg-gray-50"
            disabled={!waiverUrl}
          >
            <ExternalLink className="h-4 w-4" />
            Open Waiver Document
          </Button>

          <p className="px-4 text-center text-xs text-gray-500">
            Please review the complete document before proceeding with the signature.
          </p>
        </div>
      )}

      <div className="my-6 w-full space-y-4 sm:my-8 sm:space-y-6">
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
            <label htmlFor="agreedToTerms" className="flex-1 text-sm font-bold leading-5">
              By checking this box, I agree to the terms of service stated above.
            </label>
          </div>
          {showError && (
            <p className="mt-2 text-xs text-red-500 sm:text-sm">You must agree to the terms before continuing.</p>
          )}
        </div>

        {/* Mobile reminder to view waiver */}
        {isMobile && !hasViewedWaiver && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm text-amber-800">
              <strong>Please note:</strong> Make sure to open and review the waiver document above before signing.
            </p>
          </div>
        )}

        <div className="mb-2">
          <p className="mb-2 text-sm font-bold leading-5">You are signing for the following participants:</p>
          <div className="flex flex-wrap gap-3 text-sm sm:gap-12">
            {participants.map((p) => (
              <span
                key={p.userID}
                className="rounded bg-gray-100 px-2 py-1 text-xs sm:bg-transparent sm:px-0 sm:py-0 sm:text-sm"
              >
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
            className="bg-[#488644] px-6 py-2 text-sm text-white hover:bg-[#3a6d37] sm:px-4 sm:py-2"
            disabled={!signed || !waiverUrl}
          >
            <span className="mr-2">
              {currentIndex === waivers.length - 1 ? "Complete Registration" : "Next Waiver"}
            </span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
