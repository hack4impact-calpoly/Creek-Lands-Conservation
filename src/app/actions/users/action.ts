"use server";

import connectDB from "@/database/db";
import User from "@/database/userSchema";
import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";

export interface UserStats {
  totalUsers: number;
  totalAdmins: number;
  totalChildren: number;
  totalDonators: number;
}

export interface UserData {
  _id: string;
  clerkID: string;
  firstName: string;
  lastName: string;
  email: string;
  userRole: "user" | "admin" | "donator";
  children: Array<{ _id: string; firstName: string; lastName: string }>;
  createdAt: Date;
  imageUrl?: string;
}

export async function getUsers(): Promise<UserData[]> {
  try {
    await connectDB();
    const users = await User.find({})
      .select("clerkID firstName lastName email userRole children createdAt imageUrl")
      .sort({ createdAt: -1 })
      .lean();
    return users.map((user, index) => {
      if (!user._id) {
        console.warn(`User at index ${index} has no _id:`, user);
      }
      return {
        _id: user._id?.toString() || `missing-id-${index}`, // Fallback for missing _id
        clerkID: user.clerkID || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        userRole: user.userRole || "user",
        children: Array.isArray(user.children)
          ? user.children.map((child: any, childIndex: number) => {
              if (!child._id) {
                console.warn(`Child at user index ${index}, child index ${childIndex} has no _id:`, child);
              }
              return {
                _id: child._id?.toString() || `missing-child-id-${childIndex}`,
                firstName: child.firstName || "",
                lastName: child.lastName || "",
              };
            })
          : [],
        createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
        imageUrl: user.imageUrl || undefined,
      };
    });
  } catch (error) {
    throw new Error("Failed to fetch users");
  }
}

export async function getUserStats(): Promise<UserStats> {
  try {
    await connectDB();

    const users = await User.find({}).select("userRole children").lean();

    const totalUsers = users.filter((user) => user.userRole === "user").length;
    const totalAdmins = users.filter((user) => user.userRole === "admin").length;
    const totalDonators = users.filter((user) => user.userRole === "donator").length;
    const totalChildren = users.reduce((sum, user) => sum + (user.children?.length || 0), 0);

    return {
      totalUsers,
      totalAdmins,
      totalChildren,
      totalDonators,
    };
  } catch (error) {
    console.error("Error fetching user stats:", error);
    throw new Error("Failed to fetch user statistics");
  }
}

export async function updateUserRole(userId: string, newRole: "user" | "admin" | "donator") {
  try {
    await connectDB();

    // Find the user to get their clerkID
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Update role in your database
    const updatedUser = await User.findByIdAndUpdate(userId, { userRole: newRole }, { new: true });

    if (!updatedUser) {
      throw new Error("Failed to update user in database");
    }

    // Update role in Clerk's metadata
    try {
      const client = await clerkClient();
      await client.users.updateUserMetadata(user.clerkID, {
        publicMetadata: {
          userRole: newRole,
        },
      });
      console.log(`Successfully updated Clerk metadata for user ${user.clerkID}`);
    } catch (clerkError) {
      console.error("Error updating Clerk metadata:", clerkError);
      await User.findByIdAndUpdate(userId, { userRole: user.userRole });
      throw new Error("Failed to update user role in Clerk");
    }

    revalidatePath("/admin");
    return { success: true, message: `User role updated to ${newRole}` };
  } catch (error) {
    console.error("Error updating user role:", error);
    return { success: false, message: error instanceof Error ? error.message : "Failed to update user role" };
  }
}
