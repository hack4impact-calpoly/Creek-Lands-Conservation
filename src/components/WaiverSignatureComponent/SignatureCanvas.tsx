"use client";

import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import SignaturePad from "signature_pad";
import { useRouter } from "next/navigation";

interface SignatureCanvasProps {
  eventID: string;
}

function SignatureCanvas({ eventID }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (canvasRef.current) {
      const signaturePad = new SignaturePad(canvasRef.current, {
        backgroundColor: "white",
        penColor: "black",
      });

      signaturePadRef.current = signaturePad;

      const handleEnd = () => {
        setIsEmpty(signaturePad.isEmpty());
      };

      signaturePad.addEventListener("endStroke", handleEnd);

      return () => {
        signaturePad.removeEventListener("endStroke", handleEnd);
        signaturePadRef.current = null;
      };
    }
  }, []);

  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      setIsEmpty(signaturePadRef.current.isEmpty());
    }
  };

  const saveSignature = async () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      setIsSaving(true);
      console.log("Submitting to:", `/api/events/${eventID}/waiver`);
      try {
        const dataURL = signaturePadRef.current.toDataURL();
        console.log(`Signature: ${dataURL}`);

        const res = await fetch(`/api/events/${eventID}/waiver`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            signatureBase64: dataURL,
          }),
        });

        const result = await res.json();

        if (res.ok) {
          setSuccessMsg("Waiver signed successfully!");
          console.log("Signed PDF URL:", result.signedPdfUrl);
          clearSignature();
        } else {
          console.error(result.error);
          setSuccessMsg(`Error: ${result.error}`);
        }
      } catch (err) {
        console.error("Error saving signature:", err);
        setSuccessMsg("Error submitting signature.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="w-[400px]">
      <canvas ref={canvasRef} width={400} height={100} style={{ border: "1px solid black" }} />
      <div className="mt-2 flex justify-between">
        <Button
          variant="destructive"
          className="border-gray-400 text-white"
          onClick={clearSignature}
          disabled={isEmpty || isSaving}
        >
          Clear
        </Button>
        <Button
          variant="default"
          className="border-gray-400 text-white"
          onClick={saveSignature}
          disabled={isEmpty || isSaving}
        >
          {isSaving ? "Submitting..." : "Submit"}
        </Button>
      </div>
      {successMsg && <p className="mt-2 text-sm text-green-600 dark:text-green-400">{successMsg}</p>}
    </div>
  );
}

export default SignatureCanvas;
