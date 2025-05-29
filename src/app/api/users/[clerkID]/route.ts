import { type NextRequest, NextResponse } from "next/server";
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

    const {
      firstName,
      lastName,
      gender,
      birthday,
      phoneNumbers,
      address,
      children,
      emergencyContacts, // Primary user's emergency contacts
      medicalInfo, // Primary user's medical info
    } = data;

    // Validation
    const errors: string[] = [];

    if (!firstName?.trim()) errors.push("First Name is required.");
    if (!lastName?.trim()) errors.push("Last Name is required.");
    if (!gender?.trim()) errors.push("Gender is required.");
    if (!birthday?.trim()) errors.push("Birthday is required.");

    if (phoneNumbers?.cell && !/^\d{10}$/.test(phoneNumbers.cell)) {
      errors.push("Cell phone number must be exactly 10 digits.");
    }
    if (phoneNumbers?.work && !/^\d{10}$/.test(phoneNumbers.work)) {
      errors.push("Work phone number must be exactly 10 digits.");
    }
    if (address?.zipCode && !/^\d{5}$/.test(address.zipCode)) {
      errors.push("ZIP code must be exactly 5 digits.");
    }

    // Validate children
    if (children && Array.isArray(children)) {
      children.forEach((child: any, index: number) => {
        if (!child.firstName?.trim()) {
          errors.push(`Child ${index + 1}: First Name is required.`);
        }
        if (!child.lastName?.trim()) {
          errors.push(`Child ${index + 1}: Last Name is required.`);
        }
        if (!child.gender?.trim()) {
          errors.push(`Child ${index + 1}: Gender is required.`);
        }
        if (!child.birthday?.trim()) {
          errors.push(`Child ${index + 1}: Birthday is required.`);
        }

        // Validate child's address if they're not using primary address
        if (!child.usePrimaryAddress && child.address) {
          if (child.address.zipCode && !/^\d{5}$/.test(child.address.zipCode)) {
            errors.push(`Child ${index + 1}: ZIP code must be exactly 5 digits.`);
          }
        }
      });
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    // Process children data to match database schema
    const processedChildren =
      children?.map((child: any) => {
        const processedChild: any = {
          firstName: child.firstName,
          lastName: child.lastName,
          birthday: child.birthday,
          gender: child.gender,
        };

        // Handle address - only save if not using primary address
        if (!child.usePrimaryAddress && child.address) {
          processedChild.address = {
            home: child.address.home || "",
            city: child.address.city || "",
            zipCode: child.address.zipCode || "",
          };
        } else {
          // If using primary address, don't save address (will default to empty)
          processedChild.address = {
            home: "",
            city: "",
            zipCode: "",
          };
        }

        // Handle emergency contacts - only save if not using primary contacts
        if (!child.usePrimaryEmergencyContacts && child.emergencyContacts) {
          processedChild.emergencyContacts = child.emergencyContacts;
        } else {
          // If using primary contacts, save empty array
          processedChild.emergencyContacts = [];
        }

        // Handle medical info (without photoRelease)
        processedChild.medicalInfo = {
          photoRelease: child.photoRelease || false, // Photo release is stored in medicalInfo in DB
          allergies: child.medicalInfo?.allergies || "",
          insurance: child.medicalInfo?.insurance || "",
          doctorName: child.medicalInfo?.doctorName || "",
          doctorPhone: child.medicalInfo?.doctorPhone || "",
          behaviorNotes: child.medicalInfo?.behaviorNotes || "",
          dietaryRestrictions: child.medicalInfo?.dietaryRestrictions || "",
        };

        // Preserve existing fields if they exist
        if (child._id) {
          processedChild._id = child._id;
        }

        return processedChild;
      }) || [];

    const updatedUser = await User.findOneAndUpdate(
      { clerkID: params.clerkID },
      {
        firstName,
        lastName,
        gender,
        birthday,
        phoneNumbers,
        address,
        children: processedChildren,
        emergencyContacts,
        medicalInfo, // Primary user's medical info (includes photoRelease)
      },
      { new: true },
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error("Error in PUT /api/users/[clerkID]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
