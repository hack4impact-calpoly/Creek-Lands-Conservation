"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { userOnboarding } from "./_actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  // Effect to update state once Clerk user data is available
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.primaryEmailAddress?.emailAddress || "",
      }));
    }
  }, [user]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFieldErrors({ ...fieldErrors, [e.target.name]: "" }); // Clear error when the user starts typing
  };

  // Form validation
  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.gender) errors.gender = "Gender is required.";
    if (!formData.birthday) errors.birthday = "Birthday is required.";
    if (formData.homeAddress.length < 5) errors.homeAddress = "Address must be at least 5 characters.";
    if (!/^[a-zA-Z\s]+$/.test(formData.city)) errors.city = "City must contain only letters and spaces.";
    if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) errors.zipCode = "ZIP Code is invalid.";
    if (!formData.cellPhone) errors.cellPhone = "Cell phone is required.";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await userOnboarding(new FormData(e.currentTarget));
      if (res?.message) {
        await user?.reload();
        router.push("/onboarding/children");
      } else if (res?.error) {
        setError(res.error);
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => router.push("/");

  return (
    <Card className="mx-auto max-w-lg rounded-lg bg-white p-6 shadow-md">
      <CardContent>
        <h1 className="mb-4 text-center text-xl font-bold">Complete Your Profile</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <fieldset>
            <legend className="text-lg font-semibold">Personal Information</legend>
            <div className="space-y-2">
              <label htmlFor="firstName">First Name</label>
              <Input type="text" id="firstName" name="firstName" value={formData.firstName} readOnly />

              <label htmlFor="lastName">Last Name</label>
              <Input type="text" id="lastName" name="lastName" value={formData.lastName} readOnly />

              <label htmlFor="email">Email</label>
              <Input type="email" id="email" name="email" value={formData.email} readOnly />

              <label htmlFor="gender">Gender</label>
              <Select
                name="gender"
                value={formData.gender}
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
                required
              >
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Non-binary">Non-binary</SelectItem>
                  <SelectItem value="Prefer Not to Say">Prefer Not to Say</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.gender && <p className="text-sm text-red-600">{fieldErrors.gender}</p>}

              <label htmlFor="birthday">Birthday</label>
              <Input
                type="date"
                id="birthday"
                name="birthday"
                value={formData.birthday}
                onChange={handleChange}
                required
              />
              {fieldErrors.birthday && <p className="text-sm text-red-600">{fieldErrors.birthday}</p>}
            </div>
          </fieldset>

          {/* Address */}
          <fieldset>
            <legend className="text-lg font-semibold">Address</legend>
            <div className="space-y-2">
              <label htmlFor="homeAddress">Home Address</label>
              <Input
                type="text"
                id="homeAddress"
                name="homeAddress"
                placeholder="123 Main St"
                value={formData.homeAddress}
                onChange={handleChange}
                required
              />
              {fieldErrors.homeAddress && <p className="text-sm text-red-600">{fieldErrors.homeAddress}</p>}

              <label htmlFor="city">City</label>
              <Input
                type="text"
                id="city"
                name="city"
                placeholder="Enter city"
                value={formData.city}
                onChange={handleChange}
                required
              />
              {fieldErrors.city && <p className="text-sm text-red-600">{fieldErrors.city}</p>}

              <label htmlFor="zipCode">ZIP Code</label>
              <Input
                type="text"
                id="zipCode"
                name="zipCode"
                placeholder="12345 or 12345-6789"
                value={formData.zipCode}
                onChange={handleChange}
                required
              />
              {fieldErrors.zipCode && <p className="text-sm text-red-600">{fieldErrors.zipCode}</p>}
            </div>
          </fieldset>

          {/* Contact Information */}
          <fieldset>
            <legend className="text-lg font-semibold">Contact Information</legend>
            <div className="space-y-2">
              <label htmlFor="cellPhone">Cell Phone</label>
              <Input
                type="tel"
                id="cellPhone"
                name="cellPhone"
                placeholder="(123) 456-7890"
                value={formData.cellPhone}
                onChange={handleChange}
                required
              />
              {fieldErrors.cellPhone && <p className="text-sm text-red-600">{fieldErrors.cellPhone}</p>}

              <label htmlFor="workPhone">Work Phone (Optional)</label>
              <Input
                type="tel"
                id="workPhone"
                name="workPhone"
                placeholder="(Optional)"
                value={formData.workPhone}
                onChange={handleChange}
              />
            </div>
          </fieldset>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* Buttons */}
          <div className="mt-4 flex justify-between">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Submitting..." : "Save & Continue"}
            </Button>
            <Button type="button" onClick={handleSkip} variant="secondary" disabled={isLoading}>
              Skip
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
