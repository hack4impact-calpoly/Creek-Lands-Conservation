"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { childrenOnboarding, completeOnboarding } from "../_actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ChildrenOnboardingPage() {
  const [children, setChildren] = React.useState([
    { id: Date.now(), firstName: "", lastName: "", birthday: "", gender: "" },
  ]);
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  const { user } = useUser();

  const handleAddChild = () => {
    setChildren([...children, { id: Date.now(), firstName: "", lastName: "", birthday: "", gender: "" }]);
  };

  const handleRemoveChild = (id: number) => {
    setChildren(children.filter((child) => child.id !== id));
  };

  const handleChange = (index: number, field: string, value: string) => {
    const updatedChildren = [...children];
    updatedChildren[index] = { ...updatedChildren[index], [field]: value };
    setChildren(updatedChildren);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (
      children.length > 0 &&
      children.some((child) => !child.firstName || !child.lastName || !child.birthday || !child.gender)
    ) {
      setError("All fields for each child must be filled out.");
      setIsLoading(false);
      return;
    }

    try {
      if (children.length === 0 || children.every((child) => !child.firstName && !child.lastName)) {
        await completeOnboarding();
      } else {
        const res = await childrenOnboarding(children);
        if (res?.error) {
          setError(res.error);
          return;
        }
        await user?.reload();
      }
      router.push("/"); // Redirect after onboarding
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    setIsLoading(true);
    try {
      await completeOnboarding();
      router.push("/");
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mx-auto max-w-lg rounded-lg bg-white p-6 shadow-md">
      <CardContent>
        <h1 className="mb-4 text-center text-xl font-bold">Add Your Children</h1>
        <p className="text-center text-sm text-gray-600">
          If you don&apos;t have children to add, you can skip this step.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-6">
          {children.map((child, index) => (
            <fieldset key={child.id} className="space-y-2 rounded-lg border p-4">
              <legend className="text-md font-semibold">Child {index + 1}</legend>

              <label htmlFor={`firstName-${index}`} className="block text-sm font-medium">
                First Name
              </label>
              <Input
                id={`firstName-${index}`}
                type="text"
                placeholder="Enter first name"
                value={child.firstName}
                onChange={(e) => handleChange(index, "firstName", e.target.value)}
                required
              />

              <label htmlFor={`lastName-${index}`} className="block text-sm font-medium">
                Last Name
              </label>
              <Input
                id={`lastName-${index}`}
                type="text"
                placeholder="Enter last name"
                value={child.lastName}
                onChange={(e) => handleChange(index, "lastName", e.target.value)}
                required
              />

              <label htmlFor={`birthday-${index}`} className="block text-sm font-medium">
                Birthday
              </label>
              <Input
                id={`birthday-${index}`}
                type="date"
                value={child.birthday}
                onChange={(e) => handleChange(index, "birthday", e.target.value)}
                required
              />

              <label htmlFor={`gender-${index}`} className="block text-sm font-medium">
                Gender
              </label>
              <Select value={child.gender} onValueChange={(value) => handleChange(index, "gender", value)} required>
                <SelectTrigger id={`gender-${index}`}>
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Non-binary">Non-binary</SelectItem>
                  <SelectItem value="Prefer Not to Say">Prefer Not to Say</SelectItem>
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleRemoveChild(child.id)}
                className="mt-2 text-red-600 hover:bg-red-100"
              >
                Remove Child
              </Button>
            </fieldset>
          ))}

          <div className="flex justify-center">
            <Button type="button" variant="outline" onClick={handleAddChild}>
              + Add Another Child
            </Button>
          </div>

          {error && <p className="text-center text-sm text-red-600">{error}</p>}

          <div className="mt-4 flex justify-between">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Submitting..." : "Save & Continue"}
            </Button>
            <Button type="button" variant="ghost" onClick={handleSkip} disabled={isLoading}>
              Skip
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
