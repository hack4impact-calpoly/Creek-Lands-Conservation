import User, { IUser } from "@/database/userSchema";
import connectDB from "@/database/db";

/**
 * Creates a new user in MongoDB if they don't already exist.
 * @param userData Object containing Clerk user information.
 */
export async function createUser(userData: {
  clerkUserId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
}) {
  await connectDB();

  try {
    // Check if the user already exists in MongoDB
    const existingUser = await User.findOne({ clerkID: userData.clerkUserId });
    if (existingUser) {
      console.log("User already exists:", existingUser);
      return existingUser;
    }

    const newUser = new User({
      clerkID: userData.clerkUserId,
      email: userData.email,
      firstName: userData.firstName || "",
      lastName: userData.lastName || "",
      imageUrl: userData.imageUrl || "",
      userRole: "user", // Default role
      gender: "",
      birthday: "",
      registeredEvents: [],
      waiversSigned: [],
      children: [],
    });

    await newUser.save();
    console.log("User created:", newUser);
    return newUser;
  } catch (error) {
    console.error("Error creating user:", error);
    return { error: "Failed to create user" };
  }
}

/**
 * Fetches a user from the database by ID or Clerk ID.
 * @param id MongoDB User ID (optional)
 * @param clerkUserId Clerk User ID (optional)
 */
export async function getUserById({ id, clerkUserId }: { id?: string; clerkUserId?: string }) {
  await connectDB();

  try {
    if (!id && !clerkUserId) {
      throw new Error("Either id or clerkUserId is required.");
    }

    const query = id ? { _id: id } : { clerkID: clerkUserId };

    // Populating user registered events and waiver signed with actual info
    const user = await User.findOne(query).populate("registeredEvents").populate("waiversSigned");

    if (!user) {
      return { error: "User not found" };
    }

    return { user };
  } catch (error) {
    console.error("Error fetching user:", error);
    return { error: "Failed to fetch user" };
  }
}

/**
 * Updates a user's details using their Clerk ID.
 * @param clerkUserId Clerk User ID
 * @param data Partial user object with fields to update
 */
export async function updateUser(clerkUserId: string, data: Partial<IUser>) {
  await connectDB();

  try {
    const updatedUser = await User.findOneAndUpdate(
      { clerkID: clerkUserId }, // Find user by Clerk ID
      { $set: data }, // Update only provided fields
      { new: true, runValidators: true }, // Return updated user
    );

    if (!updatedUser) {
      return { error: "User not found" };
    }

    return { updatedUser };
  } catch (error) {
    console.error("Error updating user:", error);
    return { error: "Failed to update user" };
  }
}
