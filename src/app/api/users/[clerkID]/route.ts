import { NextRequest, NextResponse } from "next/server";
import User from "@/database/userSchema";
import connectDB from "@/database/db";

// GET /api/users/[clerkID]
export async function GET(req: NextRequest, { params }: { params: { clerkID: string } }) {
  try {
    await connectDB();

    const user = await User.findOne({ clerkID: params.clerkID });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT /api/users/[clerkID]
export async function PUT(req: NextRequest, { params }: { params: { clerkID: string } }) {
  try {
    await connectDB();
    const data = await req.json();

    const { firstName, lastName, gender, birthday, phoneNumbers, address, children } = data;

    // Server-side validation
    const errors = [];

    if (!firstName.trim()) errors.push("First Name is required.");
    if (!lastName.trim()) errors.push("Last Name is required.");
    if (!gender.trim()) errors.push("Gender is required.");
    if (!birthday.trim()) errors.push("Birthday is required.");

    if (phoneNumbers.cell && !/^\d{10}$/.test(phoneNumbers.cell)) {
      errors.push("Cell phone number must be exactly 10 digits.");
    }
    if (phoneNumbers.work && !/^\d{10}$/.test(phoneNumbers.work)) {
      errors.push("Work phone number must be exactly 10 digits.");
    }
    if (address.zipCode && !/^\d{5}$/.test(address.zipCode)) {
      errors.push("ZIP code must be exactly 5 digits.");
    }
    if (errors.length > 0) {
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const updatedUser = await User.findOneAndUpdate(
      { clerkID: params.clerkID },
      {
        firstName,
        lastName,
        gender,
        birthday,
        phoneNumbers,
        address,
        children,
        // We do NOT update imageUrl, registeredEvents, or waiversSigned
        // since they aren't included in the payload
      },
      { new: true },
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
