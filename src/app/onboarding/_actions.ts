"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { updateUser } from "@/lib/users";
import { OnboardingFormData } from "@/types/onboarding";
// Utility functions
const getStringValue = (value: String | undefined | null) => (value ? String(value).trim() : "");

const getDateValue = (value: String | undefined | null) => {
  const dateString = getStringValue(value);
  return dateString ? new Date(dateString) : undefined;
};

// US-Only Phone number validation regex
const usPhoneRegex = /^(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}$/;

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

  if (data.phoneNumbers.cell && !usPhoneRegex.test(data.phoneNumbers.cell)) {
    return "Invalid US cell phone number format.";
  }

  if (data.phoneNumbers.work && !usPhoneRegex.test(data.phoneNumbers.work)) {
    return "Invalid US work phone number format.";
  }

  return null;
};

const validateChildData = (data: any) => {};

// Mark onboarding as complete in Clerk
export const completeOnboarding = async () => {
  const { userId } = await auth();
  const client = await clerkClient();

  if (!userId) return { error: "No Logged In User" };

  try {
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { onboardingComplete: true },
    });

    return { message: "Onboarding complete." };
  } catch (err) {
    console.error("Error in completeOnboarding:", err);
    return { error: "Internal error occurred while completing onboarding." };
  }
};

// Handles user onboarding form submission
export const userOnboarding = async (formData: OnboardingFormData) => {
  const { userId } = await auth();
  if (!userId) return { error: "No Logged In User" };

  const updatedData = {
    firstName: formData.firstName.trim(),
    lastName: formData.lastName.trim(),
    email: formData.email.trim(),
    gender: formData.gender,
    birthday: formData.birthday ? new Date(formData.birthday) : undefined,
    address: {
      home: formData.homeAddress.trim(),
      city: formData.city.trim(),
      zipCode: formData.zipCode.trim(),
    },
    phoneNumbers: {
      cell: formData.cellphone.trim(),
      work: formData.workphone?.trim(),
    },
  };

  // Validate extracted data before updating
  const validationError = validateUserData(updatedData);
  if (validationError) return { error: validationError };

  try {
    const mongoRes = await updateUser(userId, updatedData);
    if (mongoRes.error) return { error: mongoRes.error };

    return { message: "User Onboarding complete." };
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
    birthday: child.birthday ? new Date(child.birthday) : undefined,
    gender: child.gender as "Male" | "Female" | "Non-binary" | "Prefer Not to Say",
    registeredEvents: [],
    waiversSigned: [],
    emergencyContacts: [],
    medicalInfo: {
      photoRelease: false,
      allergies: "",
      insurance: "",
      doctorName: "",
      doctorPhone: "",
      behaviorNotes: "",
      dietaryRestrictions: "",
    },
  }));

  // TODO verify which of the fields are required.
  // Child Schema suggests neither birthday nor gender are required
  // I will require birthday, since that is probably important info.
  if (
    formattedChildren.some(
      (child) => !child.firstName || !child.lastName || !child.birthday || isNaN(child.birthday.getTime()),
    )
  ) {
    // TODO refactor this validation into a more robust function if needed later (like for the user).
    return { error: "Each child must have a valid first name, last name and birthday" };
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
