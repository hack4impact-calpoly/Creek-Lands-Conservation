"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { userOnboarding } from "./_actions";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { OnboardingFormData } from "@/types/onboarding";
import { InputField } from "@/components/Forms/InputField";
import { SelectField } from "@/components/Forms/SelectField";
import { FormActions } from "@/components/Forms/FormActions";
import { useToast } from "@/hooks/use-toast";

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<OnboardingFormData>();

  // Effect to prefill user data once clerk is
  useEffect(() => {
    if (user) {
      setValue("firstName", user.firstName || "");
      setValue("lastName", user.lastName || "");
      setValue("email", user.primaryEmailAddress?.emailAddress || "");
    }
  }, [user, setValue]);

  const onSubmit = async (data: OnboardingFormData) => {
    try {
      const res = await userOnboarding(data);
      if (res?.error) {
        throw new Error(res.error);
      }
      // no toast here because users still have one more step to complete
      await user?.reload();
      router.push("/onboarding/children");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update information, please try again.",
        variant: "destructive",
      });
      console.error("Onboarding failed:", error);
    }
  };

  const handleSkip = () => router.push("/");

  return (
    <Card className="mx-auto max-w-lg rounded-lg bg-white p-2 shadow-md">
      <CardContent>
        <h1 className="mb-4 text-center text-xl font-bold">Complete Your Profile</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          <fieldset className="flex flex-col gap-3 rounded-lg border p-4 sm:gap-4">
            <legend className="text-lg font-semibold">Personal Information</legend>

            <InputField label="First Name" name="firstName" register={register} disabled />

            <InputField label="Last Name" name="lastName" register={register} disabled />

            <InputField label="Email" name="email" type="email" register={register} disabled />

            <SelectField
              label="Gender *"
              name="gender"
              options={[
                { value: "Male", label: "Male" },
                { value: "Female", label: "Female" },
                { value: "Non-binary", label: "Non-binary" },
                { value: "Prefer Not to Say", label: "Prefer Not to Say" },
              ]}
              control={control}
              placeholder="Select Gender"
              rules={{ required: "Gender is required" }}
            />

            <InputField
              label="Birthday *"
              name="birthday"
              type="date"
              register={register}
              error={errors.birthday}
              rules={{ required: "Birthday is required" }}
            />
          </fieldset>

          {/* Address */}
          <fieldset className="flex flex-col gap-3 rounded-lg border p-4 sm:gap-4">
            <legend className="text-lg font-semibold">Address</legend>

            <InputField
              label="Home Address *"
              name="homeAddress"
              register={register}
              error={errors.homeAddress}
              placeholder="123 Main St"
              rules={{
                required: "Address is required",
                minLength: { value: 5, message: "Address must be at least 5 characters" },
              }}
            />

            <InputField
              label="City *"
              name="city"
              register={register}
              error={errors.city}
              placeholder="Enter City"
              rules={{
                required: "City is required",
                pattern: {
                  value: /^[a-zA-Z\s]+$/,
                  message: "City must contain only letters and spaces",
                },
              }}
            />

            <InputField
              label="ZIP Code *"
              name="zipCode"
              register={register}
              error={errors.zipCode}
              placeholder="12345 or 12345-6789"
              rules={{
                required: "ZIP Code is required",
                pattern: {
                  value: /^\d{5}(-\d{4})?$/,
                  message: "Invalid ZIP Code format",
                },
              }}
            />
          </fieldset>

          {/* Contact Information */}
          <fieldset className="flex flex-col gap-3 rounded-lg border p-4 sm:gap-4">
            <legend className="text-lg font-semibold">Contact Information</legend>
            <InputField
              label="Cell Phone *"
              name="cellphone"
              type="tel"
              register={register}
              error={errors.cellphone}
              placeholder="(123) 456-7890"
              rules={{ required: "Cell phone is required" }}
            />

            <InputField
              label="Work Phone (Optional)"
              name="workphone"
              type="tel"
              register={register}
              placeholder="(Optional)"
            />
          </fieldset>

          <FormActions
            onSecondary={handleSkip}
            isSubmitting={isSubmitting}
            submitLabel="Save & Continue"
            secondaryLabel="Skip"
          />
        </form>
      </CardContent>
    </Card>
  );
}
