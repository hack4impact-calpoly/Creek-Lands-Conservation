import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/database/db";
import User from "@/database/userSchema";

export async function POST(req: NextRequest, { params }: { params: { clerkID: string } }) {
  try {
    await connectDB();
    const data = await req.json();

    const newChild = {
      firstName: data.firstName,
      lastName: data.lastName,
      birthday: data.birthday,
      gender: data.gender,
      emergencyContacts: data.emergencyContacts || [],
      medicalInfo: data.medicalInfo || {},
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
