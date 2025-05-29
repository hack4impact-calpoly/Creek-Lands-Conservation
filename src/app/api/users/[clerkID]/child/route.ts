import { type NextRequest, NextResponse } from "next/server";
import connectDB from "@/database/db";
import User from "@/database/userSchema";

export async function POST(req: NextRequest, { params }: { params: { clerkID: string } }) {
  try {
    await connectDB();
    const data = await req.json();

    // Validate required fields
    const errors: string[] = [];
    if (!data.firstName?.trim()) errors.push("First Name is required.");
    if (!data.lastName?.trim()) errors.push("Last Name is required.");
    if (!data.gender?.trim()) errors.push("Gender is required.");
    if (!data.birthday?.trim()) errors.push("Birthday is required.");

    if (errors.length > 0) {
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const newChild = {
      firstName: data.firstName,
      lastName: data.lastName,
      birthday: data.birthday,
      gender: data.gender,
      // Address - default to empty (will use primary address by default in UI)
      address: {
        home: "",
        city: "",
        zipCode: "",
      },
      // Emergency contacts - default to empty (will use primary contacts by default in UI)
      emergencyContacts: [],
      // Medical info with photo release
      medicalInfo: {
        photoRelease: false, // Default to false
        allergies: "",
        insurance: "",
        doctorName: "",
        doctorPhone: "",
        behaviorNotes: "",
        dietaryRestrictions: "",
      },
    };

    const updatedUser = await User.findOneAndUpdate(
      { clerkID: params.clerkID },
      { $push: { children: newChild } },
      { new: true },
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const addedChild = updatedUser.children[updatedUser.children.length - 1];

    return NextResponse.json({ child: addedChild }, { status: 200 });
  } catch (error) {
    console.error("Add child failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
