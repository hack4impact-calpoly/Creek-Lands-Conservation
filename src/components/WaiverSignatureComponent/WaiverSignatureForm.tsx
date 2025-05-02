"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { InputField } from "@/components/Forms/InputField";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import SignatureCanvas from "./SignatureCanvas";
import { title } from "process";

type WaiverSignatureFormProps = {
  eventID: string;
  waiverID: string;
  title?: string;
  participants: {
    firstName: string;
    lastName: string;
    userID: string;
  }[];
  // onSigned: (data: { waiverId: string; participantId: string; signature: string }) => void;
};

type WaiverSignatureFormData = {
  agreedToTerms: boolean;
};

export default function WaiverSignatureForm(props: WaiverSignatureFormProps) {
  const { eventID, waiverID, title, participants } = props;
  const [waiverName] = useState(title || "Waiver and Liability Agreement");
  const [waiverUrl, setWaiverUrl] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WaiverSignatureFormData>();

  useEffect(() => {
    const fetchWaiver = async () => {
      const res = await fetch(
        `/api/s3/presigned-waiver?fileName=${encodeURIComponent(
          "1745601581740-8373191ac57207f0611156757ec9316e-Revised 3_2025_ CLC ED PROGRAM WAIVER AND RELEASE (Engl & Esp).pdf",
        )}&mimetype=application/pdf&type=template&eventId=6813445539132eb8cd0958ab`,
      );
      const data = await res.json();
      console.log(data);
      setWaiverUrl(data.fileUrl);
    };
    fetchWaiver();
  }, [waiverID]);

  const onSubmit = (values: WaiverSignatureFormData) => {
    // TODO  actually use this
  };

  return (
    <div className="mx-auto mb-10 flex max-w-[960px] flex-col items-center px-6">
      <h1 className="mb-6 mr-auto mt-4 text-2xl font-semibold">{waiverName}</h1>

      <iframe src={waiverUrl} className="min-h-[600px] w-full rounded border" title="Waiver Preview" />

      <form onSubmit={handleSubmit(onSubmit)} className="my-8 w-full space-y-6">
        <div>
          <div className="flex items-start gap-2">
            <Checkbox
              id="agree"
              {...register("agreedToTerms", {
                validate: (value) => value === true || "You must agree to the terms before continuing.",
              })}
            />
            <label htmlFor="agree" className="text-sm font-bold leading-5">
              By checking this box, I agree to the terms of service stated above.
            </label>
          </div>
          {errors.agreedToTerms && <p className="text-xs text-red-500 sm:text-sm">{errors.agreedToTerms.message}</p>}
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
        <div className="flex justify-center">
          <SignatureCanvas></SignatureCanvas>
        </div>
        <div className="flex justify-center">
          <Button type="submit" className="bg-[#488644] text-white hover:bg-[#3a6d37]">
            Proceeed to Payment <ChevronRight />
          </Button>
        </div>
      </form>
    </div>
  );
}
