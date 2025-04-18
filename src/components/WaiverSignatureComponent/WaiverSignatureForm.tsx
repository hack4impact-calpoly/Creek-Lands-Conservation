import { useState } from "react";
import { useForm } from "react-hook-form";
import { InputField } from "@/components/Forms/InputField";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

type WaiverSignatureFormProps = {
  participantType: "adult" | "child";
  // TODO: can I be more detailed here? (guardian info, ID's, separate first/last name)
  participantName?: string;
  waiverId: string;
  // TODO: should this be passed in as a no argument lambda instead? -> then parent controls arguments
  onSigned: (data: { waiverId: string; participantId: string; signature: string }) => void;
};
// TODO: integrate the signature pad -> need this to be merged
// TODO: integrate the s3 bucket fetching of waiver -> need this to be merged

type WaiverSignatureFormData = {
  agreedToTerms: boolean;
  participant: {
    firstName: string;
    lastName: string;
    ESignature: string;
  };
  guardian?: {
    firstName: string;
    lastName: string;
    ESignature: string;
  };
};

export default function WaiverSignatureForm(props: WaiverSignatureFormProps) {
  const { participantType, waiverId, onSigned } = props;
  // TODO: is this going to be dynamic?
  const [waiverName] = useState("Outdoor Hiking Waiver and Liability Agreement");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WaiverSignatureFormData>();

  const onSubmit = (values: WaiverSignatureFormData) => {
    // TODO  actually use this
  };

  return (
    <div className="mx-auto mb-10 flex max-w-[960px] flex-col items-center px-6">
      <h1 className="mb-6 mr-auto mt-4 text-2xl font-semibold">{waiverName}</h1>

      <iframe src="/waiver.pdf" className="min-h-[600px] w-full rounded border" title="Waiver Preview" />

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

        <div className={participantType === "child" ? "grid grid-cols-1 gap-6 md:grid-cols-2" : "space-y-6"}>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Participant&apos;s Name</h2>
            <div className="grid grid-cols-2 gap-4">
              <InputField
                name="participant.firstName"
                label="First Name *"
                placeholder="e.g. John"
                register={register}
                rules={{ required: "* required" }}
                error={errors.participant?.firstName}
              />
              <InputField
                name="participant.lastName"
                label="Last Name *"
                placeholder="e.g. Smith"
                register={register}
                rules={{ required: "* required" }}
                error={errors.participant?.lastName}
              />
            </div>
            <InputField
              name="participant.ESignature"
              label="Participant E-Signature"
              placeholder="Sign Here *"
              register={register}
              rules={{ required: "Participant signature is required" }}
              error={errors.participant?.ESignature}
            />
          </div>

          {participantType === "child" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Guardian&apos;s Name</h2>
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  name="guardian.firstName"
                  label="First Name *"
                  placeholder="e.g. John"
                  register={register}
                  rules={{ required: "* required" }}
                  error={errors.guardian?.firstName}
                />
                <InputField
                  name="guardian.lastName"
                  label="Last Name *"
                  placeholder="e.g. Smith"
                  register={register}
                  rules={{ required: "* required" }}
                  error={errors.guardian?.lastName}
                />
              </div>
              <InputField
                name="guardian.ESignature"
                label="Guardian E-Signature"
                placeholder="Sign Here"
                register={register}
                rules={{ required: "Guardian signature is required" }}
                error={errors.guardian?.ESignature}
              />
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <Button type="submit" className="bg-[#488644] text-white hover:bg-[#3a6d37]">
            Complete Event Registration <ChevronRight />
          </Button>
        </div>
      </form>
    </div>
  );
}
