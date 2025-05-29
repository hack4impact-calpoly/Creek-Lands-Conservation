import { type NextRequest, NextResponse } from "next/server";
import connectDB from "@/database/db";
import User from "@/database/userSchema";
import mongoose from "mongoose";
import Waiver from "@/database/waiverSchema";
import { deleteFileFromS3 } from "@/lib/s3";
import Event from "@/database/eventSchema";

async function unregisterChildFromEvent(
  eventId: string,
  parentId: string,
  childId: string,
  session?: mongoose.ClientSession,
) {
  const event = await Event.findById(eventId).session(session ?? null);
  if (!event) {
    throw new Error("Event not found");
  }

  const childRegIndex = event.registeredChildren.findIndex(
    (rc: any) => rc.parent.toString() === parentId && rc.childId.toString() === childId,
  );
  if (childRegIndex === -1) {
    return; // Child not registered for this event
  }

  event.registeredChildren.splice(childRegIndex, 1);

  const waivers = await Waiver.find({
    eventId,
    type: "completed",
    belongsToUser: parentId,
    childSubdocId: childId,
  }).session(session ?? null);

  for (const waiver of waivers) {
    try {
      await deleteFileFromS3(waiver.fileKey);
      console.log(`Deleted S3 file: ${waiver.fileKey}`);
    } catch (s3Err) {
      console.error(`Failed to delete S3 file ${waiver.fileKey}:`, s3Err);
    }
  }

  await Waiver.deleteMany({ _id: { $in: waivers.map((w) => w._id) } }, { session });

  await User.findByIdAndUpdate(
    parentId,
    {
      $pull: {
        "children.$[child].registeredEvents": eventId,
        "children.$[child].waiversSigned": { $in: waivers.map((w) => w._id) },
      },
    },
    {
      arrayFilters: [{ "child._id": childId }],
      session,
    },
  );

  await event.save({ session });
}

export async function DELETE(req: NextRequest, { params }: { params: { clerkID: string; childID: string } }) {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(params.childID)) {
      return NextResponse.json({ error: "Invalid child ID format" }, { status: 400 });
    }

    const user = await User.findOne({ clerkID: params.clerkID });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!Array.isArray(user.children) || user.children.length === 0) {
      return NextResponse.json({ error: "No children found for this user" }, { status: 404 });
    }

    const child = user.children.find((c: any) => c._id.toString() === params.childID);
    if (!child) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    const events = await Event.find({
      "registeredChildren.childId": params.childID,
    });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      for (const event of events) {
        await unregisterChildFromEvent(event._id.toString(), user._id.toString(), params.childID, session);
      }

      // Remove the child using $pull
      await User.updateOne(
        { clerkID: params.clerkID },
        { $pull: { children: { _id: new mongoose.Types.ObjectId(params.childID) } } },
        { session },
      );

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      console.error("Error in delete child transaction:", err);
      return NextResponse.json({ error: "Failed to delete child due to server error" }, { status: 500 });
    } finally {
      session.endSession();
    }

    return NextResponse.json({ message: "Child deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Delete child failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT /api/users/[clerkID]/child/[childID]
export async function PUT(req: NextRequest, { params }: { params: { clerkID: string; childID: string } }) {
  try {
    await connectDB();
    const data = await req.json();

    // Validate childID format
    if (!mongoose.Types.ObjectId.isValid(params.childID)) {
      return NextResponse.json({ error: "Invalid child ID format" }, { status: 400 });
    }

    // Validate required fields
    const errors: string[] = [];
    if (!data.firstName?.trim()) errors.push("First Name is required.");
    if (!data.lastName?.trim()) errors.push("Last Name is required.");
    if (!data.gender?.trim()) errors.push("Gender is required.");
    if (!data.birthday?.trim()) errors.push("Birthday is required.");

    // Validate address if not using primary
    if (!data.usePrimaryAddress && data.address?.zipCode && !/^\d{5}$/.test(data.address.zipCode)) {
      errors.push("ZIP code must be exactly 5 digits.");
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = {
      "children.$.firstName": data.firstName,
      "children.$.lastName": data.lastName,
      "children.$.birthday": data.birthday,
      "children.$.gender": data.gender,
    };

    // Handle address
    if (!data.usePrimaryAddress && data.address) {
      updateData["children.$.address"] = {
        home: data.address.home || "",
        city: data.address.city || "",
        zipCode: data.address.zipCode || "",
      };
    } else {
      updateData["children.$.address"] = {
        home: "",
        city: "",
        zipCode: "",
      };
    }

    // Handle emergency contacts
    if (!data.usePrimaryEmergencyContacts && data.emergencyContacts) {
      updateData["children.$.emergencyContacts"] = data.emergencyContacts;
    } else {
      updateData["children.$.emergencyContacts"] = [];
    }

    // Handle medical info
    updateData["children.$.medicalInfo"] = {
      photoRelease: data.photoRelease || false,
      allergies: data.medicalInfo?.allergies || "",
      insurance: data.medicalInfo?.insurance || "",
      doctorName: data.medicalInfo?.doctorName || "",
      doctorPhone: data.medicalInfo?.doctorPhone || "",
      behaviorNotes: data.medicalInfo?.behaviorNotes || "",
      dietaryRestrictions: data.medicalInfo?.dietaryRestrictions || "",
    };

    const updatedUser = await User.findOneAndUpdate(
      {
        clerkID: params.clerkID,
        "children._id": params.childID,
      },
      { $set: updateData },
      { new: true },
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User or child not found" }, { status: 404 });
    }

    const updatedChild = updatedUser.children.find((child: any) => child._id.toString() === params.childID);

    return NextResponse.json({ child: updatedChild }, { status: 200 });
  } catch (error) {
    console.error("Update child failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
