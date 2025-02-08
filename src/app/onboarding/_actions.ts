"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { updateUser } from "@/lib/users"; // Importing the existing updateUser function

export const completeOnboarding = async (formData: FormData) => {
  const { userId } = await auth();
  const client = await clerkClient();

  if (!userId) {
    return { error: "No Logged In User" };
  }

  const getStringValue = (value: FormDataEntryValue | null) => (value !== null ? String(value).trim() : ""); // Trim spaces
  const getDateValue = (value: FormDataEntryValue | null) => {
    const dateString = getStringValue(value);
    return dateString ? new Date(dateString) : undefined; // Convert to Date or undefined
  };

  // Extract data from form
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

  // ✅ **Client-side Validation Before Database Interaction**
  if (!updatedData.firstName || !updatedData.lastName || !updatedData.email) {
    return { error: "First name, last name, and email are required." };
  }

  if (updatedData.birthday && isNaN(updatedData.birthday.getTime())) {
    return { error: "Invalid date format for birthday." };
  }

  if (updatedData.address.home && updatedData.address.home.length < 5) {
    return { error: "Home address must be at least 5 characters long." };
  }

  if (updatedData.address.city && !/^[a-zA-Z\s]+$/.test(updatedData.address.city)) {
    return { error: "City must contain only letters and spaces." };
  }

  if (updatedData.address.zipCode && !/^\d{5}(-\d{4})?$/.test(updatedData.address.zipCode)) {
    return { error: "Invalid zip code format." };
  }

  try {
    // First, update the user data in MongoDB
    const mongoRes = await updateUser(userId, updatedData);

    if (mongoRes.error) {
      return { error: mongoRes.error }; // If MongoDB update fails, stop the process
    }

    // Only after a successful MongoDB update, update Clerk metadata
    await client.users.updateUser(userId, {
      publicMetadata: { onboardingComplete: true },
    });

    return { message: "Onboarding complete." };
  } catch (err) {
    console.error("Error in completeOnboarding:", err);
    return { error: "Internal error occurred while completing onboarding." };
  }
};
