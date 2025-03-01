"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { userOnboarding } from "./_actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { OnboardingFormData } from "@/types/onboarding";
import { FormField } from "@/components/Forms/FormField";
import { SelectField } from "@/components/Forms/SelectField";
import { FormActions } from "@/components/Forms/FormActions";

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const {
    register,
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
      const formData = new FormData();

      // TODO once _actions is updated to accept better types, remove this
      Object.entries(data).forEach(([key, value]) => formData.append(key, value));

      const res = await userOnboarding(formData);
      if (res?.message) {
        await user?.reload();
        router.push("/onboarding/children");
      }
    } catch (error) {
      console.error("Onboarding failed:", error);
    }
  };

  const handleSkip = () => router.push("/");

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    gender: "",
    birthday: "",
    homeAddress: "",
    city: "",
    zipCode: "",
    cellPhone: "",
    workPhone: "",
  });

  // Field-specific errors
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFieldErrors({ ...fieldErrors, [e.target.name]: "" }); // Clear error when the user starts typing
  };

  // Form validation
  // const validateForm = () => {
  //   const errors: { [key: string]: string } = {};

  //   if (!formData.gender) errors.gender = "Gender is required.";
  //   if (!formData.birthday) errors.birthday = "Birthday is required.";
  //   if (formData.homeAddress.length < 5) errors.homeAddress = "Address must be at least 5 characters.";
  //   if (!/^[a-zA-Z\s]+$/.test(formData.city)) errors.city = "City must contain only letters and spaces.";
  //   if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) errors.zipCode = "ZIP Code is invalid.";
  //   if (!formData.cellPhone) errors.cellPhone = "Cell phone is required.";

  //   setFieldErrors(errors);
  //   return Object.keys(errors).length === 0;
  // };

  return (
    <Card className="mx-auto max-w-lg rounded-lg bg-white p-6 shadow-md">
      <CardContent>
        <h1 className="mb-4 text-center text-xl font-bold">Complete Your Profile</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          <fieldset className="grid grid-cols-1 gap-3 sm:gap-4">
            <legend className="mb-2 text-lg font-semibold">Personal Information</legend>

            <FormField label="First Name" name="firstName" register={register} disabled />

            <FormField label="Last Name" name="lastName" register={register} disabled />

            <FormField label="Email" name="email" type="email" register={register} disabled />

            <SelectField
              label="Gender *"
              name="gender"
              options={[
                { value: "Male", label: "Male" },
                { value: "Female", label: "Female" },
                { value: "Non-binary", label: "Non-binary" },
                { value: "Prefer Not to Say", label: "Prefer Not to Say" },
              ]}
              register={register}
              error={errors.gender}
              placeholder="Select Gender"
            />

            <FormField label="Birthday *" name="birthday" type="date" register={register} error={errors.birthday} />
          </fieldset>

          {/* Address */}
          <fieldset className="grid grid-cols-1 gap-3 sm:gap-4">
            <legend className="mb-2 text-lg font-semibold">Address</legend>

            <FormField
              label="Home Address *"
              name="homeAddress"
              register={register}
              error={errors.homeAddress}
              placeholder="123 Main St"
            />

            <FormField label="City *" name="city" register={register} error={errors.city} placeholder="Enter City" />

            <FormField
              label="ZIP Code *"
              name="zipCode"
              register={register}
              error={errors.zipCode}
              placeholder="12345 or 12345-6789"
            />
          </fieldset>

          {/* Contact Information */}
          <fieldset className="grid grid-cols-1 gap-3 sm:gap-4">
            <legend className="mb-2 text-lg font-semibold">Contact Information</legend>
            <FormField
              label="Cell Phone *"
              name="cellphone"
              type="tel"
              register={register}
              error={errors.cellphone}
              placeholder="(123) 456-7890"
            />

            <FormField
              label="Work Phone (Optional)"
              name="workphone"
              type="tel"
              register={register}
              placeholder="(Optional)"
            />
          </fieldset>

          {errors && <p className="text-sm text-red-600">{errors.root?.message}</p>}

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
