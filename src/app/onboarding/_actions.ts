"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { updateUser } from "@/lib/users";

// Utility functions
const getStringValue = (value: FormDataEntryValue | null) => (value !== null ? String(value).trim() : "");

const getDateValue = (value: FormDataEntryValue | null) => {
  const dateString = getStringValue(value);
  return dateString ? new Date(dateString) : undefined;
};

// Validation function for user data
const validateUserData = (data: any) => {
  if (!data.firstName || !data.lastName || !data.email) {
    return "First name, last name, and email are required.";
  }

  if (data.birthday && isNaN(data.birthday.getTime())) {
    return "Invalid date format for birthday.";
  }

  if (data.address.home && data.address.home.length < 5) {
    return "Home address must be at least 5 characters long.";
  }

  if (data.address.city && !/^[a-zA-Z\s]+$/.test(data.address.city)) {
    return "City must contain only letters and spaces.";
  }

  if (data.address.zipCode && !/^\d{5}(-\d{4})?$/.test(data.address.zipCode)) {
    return "Invalid zip code format.";
  }

  return null;
};

// Mark onboarding as complete in Clerk
export const completeOnboarding = async () => {
  const { userId } = await auth();
  const client = await clerkClient();

  if (!userId) return { error: "No Logged In User" };

  try {
    await client.users.updateUser(userId, {
      publicMetadata: { onboardingComplete: true },
    });

    return { message: "Onboarding complete." };
  } catch (err) {
    console.error("Error in completeOnboarding:", err);
    return { error: "Internal error occurred while completing onboarding." };
  }
};

// Handles user onboarding form submission
export const userOnboarding = async (formData: FormData) => {
  const { userId } = await auth();
  if (!userId) return { error: "No Logged In User" };

  const updatedData = {
    firstName: getStringValue(formData.get("firstName")),
    lastName: getStringValue(formData.get("lastName")),
    email: getStringValue(formData.get("email")),
    gender: getStringValue(formData.get("gender")) as "" | "Male" | "Female" | "Non-binary" | "Prefer Not to Say",
    birthday: getDateValue(formData.get("birthday")),
    address: {
      home: getStringValue(formData.get("homeAddress")),
      city: getStringValue(formData.get("city")),
      zipCode: getStringValue(formData.get("zipCode")),
    },
    phoneNumbers: {
      cell: getStringValue(formData.get("cellPhone")),
      work: getStringValue(formData.get("workPhone")),
    },
  };

  // Validate extracted data before updating
  const validationError = validateUserData(updatedData);
  if (validationError) return { error: validationError };

  try {
    const mongoRes = await updateUser(userId, updatedData);
    if (mongoRes.error) return { error: mongoRes.error };

    return { message: "Onboarding complete." };
  } catch (err) {
    console.error("Error in userOnboarding:", err);
    return { error: "Internal error occurred while completing onboarding." };
  }
};

// Handles adding children during onboarding
export const childrenOnboarding = async (
  children: { firstName: string; lastName: string; birthday: string; gender: string }[],
) => {
  const { userId } = await auth();
  if (!userId) return { error: "No Logged In User" };

  // Validate child entries
  const formattedChildren = children.map((child) => ({
    firstName: child.firstName.trim(),
    lastName: child.lastName.trim(),
    birthday: new Date(child.birthday),
    gender: child.gender as "Male" | "Female" | "Non-binary" | "Prefer Not to Say",
    registeredEvents: [],
    waiversSigned: [],
  }));

  if (formattedChildren.some((child) => !child.firstName || !child.lastName || isNaN(child.birthday.getTime()))) {
    return { error: "Each child must have a valid first name, last name, and birthday." };
  }

  try {
    const mongoRes = await updateUser(userId, { children: formattedChildren });
    if (mongoRes.error) return { error: mongoRes.error };

    await completeOnboarding();

    return { message: "Children added successfully." };
  } catch (err) {
    console.error("Error in childrenOnboarding:", err);
    return { error: "Internal error occurred while adding children." };
  }
};
