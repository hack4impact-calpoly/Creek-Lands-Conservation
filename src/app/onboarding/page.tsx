"use client";

import * as React from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "./_actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function OnboardingPage() {
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const { user } = useUser();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);

    if (
      !formData.get("gender") ||
      !formData.get("birthday") ||
      !formData.get("homeAddress") ||
      !formData.get("city") ||
      !formData.get("zipCode") ||
      !formData.get("cellPhone")
    ) {
      setError("All required fields must be filled out correctly.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await completeOnboarding(formData);
      if (res?.message) {
        try {
          await user?.reload();
        } catch (reloadError) {
          console.error("User reload failed:", reloadError);
        }
        router.push("/");
      } else if (res?.error) {
        setError(res.error);
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    router.push("/");
  };

  return (
    <Card className="mx-auto max-w-lg rounded-lg p-6 shadow-md">
      <CardContent>
        <h1 className="mb-4 text-xl font-bold">Complete Your Profile</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input type="text" name="firstName" readOnly value={user?.firstName || ""} />
          <Input type="text" name="lastName" readOnly value={user?.lastName || ""} />
          <Input type="email" name="email" readOnly value={user?.primaryEmailAddress?.emailAddress || ""} />
          <Select name="gender" required>
            <SelectTrigger>
              <SelectValue placeholder="Select Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Non-binary">Non-binary</SelectItem>
              <SelectItem value="Prefer Not to Say">Prefer Not to Say</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" name="birthday" required />
          <Input type="text" name="homeAddress" placeholder="Home Address" required />
          <Input
            type="text"
            name="city"
            placeholder="City"
            required
            pattern="^[a-zA-Z\s]+$"
            title="City must contain only letters and spaces"
          />
          <Input
            type="text"
            name="zipCode"
            placeholder="ZIP Code"
            required
            pattern="^\d{5}(-\d{4})?$"
            title="Invalid zip code format"
          />
          <Input type="tel" name="cellPhone" placeholder="Cell Phone" required />
          <Input type="tel" name="workPhone" placeholder="Work Phone (Optional)" />
          {error && <p className="text-red-600">Error: {error}</p>}
          <div className="flex justify-between">
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
