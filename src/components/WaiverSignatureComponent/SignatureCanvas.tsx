"use client";

import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import SignaturePad from "signature_pad";

function SignatureCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

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

  const saveSignature = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      const dataURL = signaturePadRef.current.toDataURL();
      console.log("Saved Signature:", dataURL); // change this to save signature in mongodb
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
          disabled={isEmpty}
        >
          Clear
        </Button>
        <Button variant="default" className="border-gray-400 text-white" onClick={saveSignature} disabled={isEmpty}>
          Save
        </Button>
      </div>
    </div>
  );
}

export default SignatureCanvas;
