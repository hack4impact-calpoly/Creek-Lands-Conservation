"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { childrenOnboarding, completeOnboarding } from "../_actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useFieldArray, useForm } from "react-hook-form";
import { InputField } from "@/components/Forms/InputField";
import { SelectField } from "@/components/Forms/SelectField";
import { FormActions } from "@/components/Forms/FormActions";
import { useToast } from "@/hooks/use-toast";
import { ChildFormData } from "@/types/onboarding";

export default function ChildrenOnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChildFormData>({
    defaultValues: {
      children: [{ firstName: "", lastName: "", birthday: "", gender: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "children",
  });

  const onSubmit = async (data: ChildFormData) => {
    try {
      const children = data.children;
      /* validation is done by the form hook, but the user can choose to
       remove all children to skip the onboarding*/
      if (children.length === 0) {
        const res = await completeOnboarding();
        if (res?.error) throw new Error(res.error);
      } else {
        const res = await childrenOnboarding(children);
        if (res?.error) throw new Error(res.error);
      }
      await user?.reload();
      toast({
        title: "Success",
        description: "Onboarding Complete!",
        variant: "success",
      });
      router.push("/");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to add children, please try again.",
        variant: "destructive",
      });
      console.error("Onboarding failed:", err.message);
    }
  };

  const handleSkip = async () => {
    try {
      const res = await completeOnboarding();
      if (res?.error) throw new Error(res.error);
      router.push("/");
    } catch (err: any) {
      console.error("Skip failed:", err.message);
    }
  };

  return (
    <Card className="mx-auto max-w-lg rounded-lg bg-white p-2 shadow-md">
      <CardContent>
        <h1 className="mb-4 text-center text-xl font-bold">Add Your Children</h1>
        <p className="text-center text-sm text-gray-600">
          {"If you don't have children to add, you can skip this step."}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          {fields.map((field, index) => (
            <fieldset key={field.id} className="flex flex-col gap-3 rounded-lg border p-4 sm:gap-4">
              <legend className="text-md font-semibold">Child {index + 1}</legend>

              <InputField
                label="First Name *"
                name={`children.${index}.firstName`}
                register={register}
                error={errors.children?.[index]?.firstName}
                rules={{
                  required: "First name is required",
                  validate: (value) => !!value.trim() || "Cannot be empty",
                }}
                placeholder="Enter first name"
              />

              <InputField
                label="Last Name *"
                name={`children.${index}.lastName`}
                register={register}
                error={errors.children?.[index]?.lastName}
                rules={{
                  required: "Last name is required",
                  validate: (value) => !!value.trim() || "Cannot be empty",
                }}
                placeholder="Enter last name"
              />

              <InputField
                label="Birthday"
                name={`children.${index}.birthday`}
                type="date"
                register={register}
                error={errors.children?.[index]?.birthday}
                rules={{ required: "Birthday is required" }} // According to Child Schema
              />

              <SelectField
                label="Gender *"
                name={`children.${index}.gender`}
                control={control}
                options={[
                  { value: "Male", label: "Male" },
                  { value: "Female", label: "Female" },
                  { value: "Non-binary", label: "Non-binary" },
                  { value: "Prefer Not to Say", label: "Prefer Not to Say" },
                ]}
                rules={{ required: "Gender is required" }}
                placeholder="Select Gender"
              />

              <Button
                type="button"
                variant="outline"
                onClick={() => remove(index)}
                className="mt-2 self-start text-red-600 hover:bg-red-100"
              >
                Remove Child
              </Button>
            </fieldset>
          ))}

          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => append({ firstName: "", lastName: "", birthday: "", gender: "" })}
            >
              + Add Another Child
            </Button>
          </div>

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
