"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { LoadingSpinner } from "../ui/loading-spinner";

interface Child {
  localId: number;
  _id?: string;
  firstName: string;
  lastName: string;
  birthday: string; // store as YYYY-MM-DD in the UI
  gender: string;
}

const genderOptions = ["Male", "Female", "Non-binary", "Prefer not to say"];
let localChildCounter = 0;

export default function PersonalInfo() {
  const { isLoaded, user } = useUser();

  // Loading & error states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Parent data
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [birthday, setBirthday] = useState("");

  // phoneNumbers and address
  const [phoneNumbers, setPhoneNumbers] = useState({ cell: "", work: "" });
  const [address, setAddress] = useState({ home: "", city: "", zipCode: "" });

  // Children
  const [children, setChildren] = useState<Child[]>([]);

  // Backup state for canceling changes
  const [originalFirstName, setOriginalFirstName] = useState("");
  const [originalLastName, setOriginalLastName] = useState("");
  const [originalGender, setOriginalGender] = useState("");
  const [originalBirthday, setOriginalBirthday] = useState("");
  const [originalPhoneNumbers, setoriginalPhoneNumbers] = useState({
    cell: "",
    work: "",
  });
  const [originalAddress, setOriginalAddress] = useState({
    home: "",
    city: "",
    zipCode: "",
  });
  const [originalChildren, setOriginalChildren] = useState<Child[]>([]);

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Editing mode
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isLoaded || !user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const response = await fetch(`/api/users/${user.id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.status}`);
        }

        const userData = await response.json();

        if (!userData || !userData._id) {
          console.warn("User not found in MongoDB");
          setError("User not found in MongoDB.");
          setLoading(false);
          return;
        }

        // Ensure children is present
        if (!userData.children || !Array.isArray(userData.children)) {
          console.warn("Children field missing or not an array");
          setChildren([]); // Reset children
        } else {
          console.log("Children Data:", userData.children); // Log children array
        }

        // Populate parent's info
        setFirstName(userData.firstName || "");
        setLastName(userData.lastName || "");
        setEmail(userData.email || "");
        setGender(userData.gender || "");
        setBirthday(
          userData.birthday
            ? new Date(userData.birthday).toISOString().split("T")[0] // Convert to YYYY-MM-DD
            : "",
        );
        setPhoneNumbers({
          cell: userData.phoneNumbers?.cell || "",
          work: userData.phoneNumbers?.work || "",
        });

        setAddress({
          home: userData.address?.home || "",
          city: userData.address?.city || "",
          zipCode: userData.address?.zipCode || "",
        });

        // Map children properly
        const mappedChildren: Child[] =
          userData.children?.map((childData: any) => {
            localChildCounter += 1;
            return {
              localId: localChildCounter,
              _id: childData._id ?? "",
              firstName: childData.firstName ?? "",
              lastName: childData.lastName ?? "",
              birthday: childData.birthday ? new Date(childData.birthday).toISOString().split("T")[0] : "",
              gender: childData.gender ?? "",
            };
          }) || [];

        setChildren(mappedChildren);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load user data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isLoaded, user]);

  const handleEditClick = () => {
    // Backup the original data before editing
    setOriginalFirstName(firstName);
    setOriginalLastName(lastName);
    setOriginalGender(gender);
    setOriginalBirthday(birthday);
    setoriginalPhoneNumbers({ ...phoneNumbers });
    setOriginalAddress({ ...address });
    setOriginalChildren([...children]);

    setIsEditing(true);
  };

  const handleAddChild = () => {
    localChildCounter += 1;
    setChildren((prev) => [
      ...prev,
      {
        localId: localChildCounter,
        _id: "",
        firstName: "",
        lastName: "",
        birthday: "",
        gender: "",
      },
    ]);
  };

  const handleDeleteChild = (localId: number) => {
    setChildren((prev) => prev.filter((child) => child.localId !== localId));
  };

  const handleEditChild = (localId: number, field: keyof Child, value: string) => {
    setChildren((prev) => prev.map((child) => (child.localId === localId ? { ...child, [field]: value } : child)));
  };

  // For phoneNumbers and address
  const handlePhoneChange = (field: "cell" | "work", value: string) => {
    setPhoneNumbers((prev) => ({ ...prev, [field]: value }));
  };
  const handleAddressChange = (field: "home" | "city" | "zipCode", value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancelChanges = () => {
    setFirstName(originalFirstName);
    setLastName(originalLastName);
    setGender(originalGender);
    setBirthday(originalBirthday);
    setPhoneNumbers({ ...originalPhoneNumbers });
    // Restore address only if the user erased it
    setAddress({
      home: address.home.trim() ? address.home : originalAddress.home,
      city: address.city.trim() ? address.city : originalAddress.city,
      zipCode: address.zipCode.trim() ? address.zipCode : originalAddress.zipCode,
    });
    setChildren([...originalChildren]);
    // Clear validation errors
    setValidationErrors([]);

    setIsEditing(false);
  };

  const validateFields = () => {
    const errors: string[] = [];

    // Parent name validation
    const isValidName = (name: string) => /^[a-zA-Z\\s]{2,50}$/.test(name.trim());

    if (!isValidName(firstName)) {
      errors.push("First Name must contain only letters and be 2-50 characters long.");
    }
    if (!isValidName(lastName)) {
      errors.push("Last Name must contain only letters and be 2-50 characters long.");
    }

    if (!email.trim()) {
      errors.push("Email is required.");
    }

    // Parent birthday validation
    const today = new Date();
    const birthDate = new Date(birthday);

    if (birthDate > today) {
      errors.push("Birthday cannot be in the future (for Primary Account Holder).");
    }
    if (!birthday.trim()) {
      errors.push("Birthday is required (for Primary Account Holder).");
    }

    if (!gender.trim()) {
      errors.push("Gender is required (for Primary Account Holder).");
    }

    // Parent phone number validation (10-digit required)
    const isValidPhoneNumber = (phone: string) => /^\d{10}$/.test(phone.trim());

    if (phoneNumbers.cell.trim() && !isValidPhoneNumber(phoneNumbers.cell)) {
      errors.push("Cell phone number must be exactly 10 digits.");
    }
    if (phoneNumbers.work.trim() && !isValidPhoneNumber(phoneNumbers.work)) {
      errors.push("Work phone number must be exactly 10 digits.");
    }

    // ZIP code validation (exactly 5 digits)
    const isValidZipCode = (zip: string) => /^\d{5}$/.test(zip.trim());

    if (address.zipCode.trim() && !isValidZipCode(address.zipCode)) {
      errors.push("ZIP code must be exactly 5 digits.");
    }

    // Address validation (if home is provided, require city & ZIP)
    if (address.home.trim()) {
      if (!address.city.trim()) {
        errors.push("City is required when home address is provided.");
      }
      if (!address.zipCode.trim()) {
        errors.push("ZIP code is required when home address is provided.");
      }
    }

    // Preserve original address if empty string is entered
    if (!address.home.trim()) address.home = originalAddress.home;
    if (!address.city.trim()) address.city = originalAddress.city;
    if (!address.zipCode.trim()) address.zipCode = originalAddress.zipCode;

    // Validating each child's required fields:
    children.forEach((child, idx) => {
      if (!isValidName(child.firstName)) {
        errors.push(`Family Member #${idx + 1}: First Name must contain only letters and be 2-50 characters long.`);
      }
      if (!isValidName(child.lastName)) {
        errors.push(`Family Member #${idx + 1}: Last Name must contain only letters and be 2-50 characters long.`);
      }
      if (!child.gender.trim()) {
        errors.push(`Family Member #${idx + 1}: Gender is required.`);
      }
      if (child.birthday) {
        const childBirthDate = new Date(child.birthday);
        if (childBirthDate > today) {
          errors.push(`Family Member #${idx + 1}: Birthday cannot be in the future.`);
        }
      } else {
        errors.push(`Family Member #${idx + 1}: Birthday is required.`);
      }
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      return false;
    }

    setValidationErrors([]);
    return true;
  };

  const handleSaveChanges = async () => {
    if (!validateFields()) {
      return; // if validation fails, do not proceed
    }

    try {
      // Prepare data for PUT
      const payload = {
        clerkID: user?.id,
        firstName,
        lastName,
        gender,
        birthday: birthday ? new Date(birthday).toISOString() : "",
        phoneNumbers: {
          cell: phoneNumbers.cell,
          work: phoneNumbers.work,
        },
        address: {
          home: address.home,
          city: address.city,
          zipCode: address.zipCode,
        },
        children: children.map((child) => ({
          firstName: child.firstName,
          lastName: child.lastName,
          birthday: child.birthday ? new Date(child.birthday).toISOString() : null,
          gender: child.gender,
        })),
      };

      const response = await fetch(`/api/users/${user?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // If server fails, revert changes
        handleCancelChanges();
        throw new Error(`Failed to update user data: ${response.status}`);
      }

      const updatedUser = await response.json();
      console.log("User updated successfully:", updatedUser);

      setIsEditing(false);
    } catch (err) {
      handleCancelChanges();
      console.error("Error updating user data:", err);
      setError("Failed to update user data. Please try again later.");
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;
  if (error) return <p>{error}</p>;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h2 className="mb-6 text-3xl font-semibold text-gray-800">Account Information</h2>

      {/* Primary Account Holder Information */}
      <section className="mb-8">
        <h3 className="mb-4 text-xl font-semibold text-gray-700">Primary Account Holder Information</h3>
        <div className="space-y-4">
          {/* First Name */}
          <div className="grid grid-cols-3 items-center gap-4">
            <label className="text-sm font-medium text-gray-700">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={!isEditing}
              className="col-span-2 w-full rounded-md border border-gray-300 p-2"
            />
          </div>

          {/* Last Name */}
          <div className="grid grid-cols-3 items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={!isEditing}
              className="col-span-2 w-full rounded-md border border-gray-300 p-2"
            />
          </div>

          {/* Gender Dropdown */}
          <div className="grid grid-cols-3 items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Gender</label>
            <select
              disabled={!isEditing}
              className="col-span-2 w-full rounded-md border border-gray-300 p-2"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">-- Select --</option>
              {genderOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Email (disabled) */}
          <div className="grid grid-cols-3 items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={user?.emailAddresses[0]?.emailAddress || ""}
              disabled
              className="col-span-2 w-full rounded-md border border-gray-300 p-2"
            />
          </div>

          {/* Birthday */}
          <div className="grid grid-cols-3 items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Birthday</label>
            <input
              type="date"
              value={birthday ? new Date(birthday).toISOString().split("T")[0] : ""}
              onChange={(e) => setBirthday(new Date(e.target.value).toISOString())}
              disabled={!isEditing}
              className="col-span-2 w-full rounded-md border border-gray-300 p-2"
            />
          </div>

          {/* Phone Number */}
          <div className="grid grid-cols-3 items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              value={phoneNumbers.cell}
              onChange={(e) => handlePhoneChange("cell", e.target.value)}
              disabled={!isEditing}
              className="col-span-2 w-full rounded-md border border-gray-300 p-2"
            />
          </div>

          {/* Medical Information (optional, no state) */}
          <div className="grid grid-cols-3 items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Medical Info (optional)</label>
            <input
              type="text"
              value=""
              disabled={!isEditing}
              className="col-span-2 w-full rounded-md border border-gray-300 p-2"
            />
          </div>
        </div>
      </section>

      {/* Address Section */}
      <section className="mt-8">
        <h3 className="mb-3 text-xl font-semibold text-gray-800">Address</h3>
        <div className="space-y-4">
          {/* Address Line 1 */}
          <div className="grid grid-cols-3 items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Address Line 1</label>
            <input
              type="text"
              value={address.home}
              onChange={(e) => handleAddressChange("home", e.target.value)}
              disabled={!isEditing}
              className="col-span-2 w-full rounded-md border border-gray-300 p-2"
            />
          </div>

          {/* Address Line 2 (optional, no state) */}
          <div className="grid grid-cols-3 items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Address Line 2 (optional)</label>
            <input
              type="text"
              value=""
              disabled={!isEditing}
              className="col-span-2 w-full rounded-md border border-gray-300 p-2"
            />
          </div>

          {/* City */}
          <div className="grid grid-cols-3 items-center gap-4">
            <label className="text-sm font-medium text-gray-700">City</label>
            <input
              type="text"
              value={address.city}
              onChange={(e) => handleAddressChange("city", e.target.value)}
              disabled={!isEditing}
              className="col-span-2 w-full rounded-md border border-gray-300 p-2"
            />
          </div>

          {/* ZIP Code */}
          <div className="grid grid-cols-3 items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Zip Code</label>
            <input
              type="text"
              value={address.zipCode}
              onChange={(e) => handleAddressChange("zipCode", e.target.value)}
              disabled={!isEditing}
              className="col-span-2 w-full rounded-md border border-gray-300 p-2"
            />
          </div>
        </div>
      </section>

      {/* Family Member Information */}
      <section className="mt-8">
        <h3 className="mb-4 text-xl font-semibold">Family Member Information</h3>
        {children.map((child, idx) => (
          <div key={child.localId} className="mb-4 space-y-4 border-b pb-4">
            {/* Child # Title (not strictly needed, but can help clarity) */}
            <div className="text-lg font-semibold">Family Member #{idx + 1}</div>

            {/* First Name */}
            <div className="grid grid-cols-3 items-center gap-4">
              <label className="text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                value={child.firstName}
                onChange={(e) => handleEditChild(child.localId, "firstName", e.target.value)}
                disabled={!isEditing}
                className="col-span-2 w-full rounded-md border border-gray-300 p-2"
              />
            </div>

            {/* Last Name */}
            <div className="grid grid-cols-3 items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                value={child.lastName}
                onChange={(e) => handleEditChild(child.localId, "lastName", e.target.value)}
                disabled={!isEditing}
                className="col-span-2 w-full rounded-md border border-gray-300 p-2"
              />
            </div>

            {/* Gender dropdown */}
            <div className="grid grid-cols-3 items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Gender</label>
              <select
                disabled={!isEditing}
                className="col-span-2 w-full rounded-md border border-gray-300 p-2"
                value={child.gender}
                onChange={(e) => handleEditChild(child.localId, "gender", e.target.value)}
              >
                <option value="">-- Select --</option>
                {genderOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Birthday */}
            <div className="grid grid-cols-3 items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Birthday</label>
              <input
                type="date"
                value={child.birthday ? new Date(child.birthday).toISOString().split("T")[0] : ""}
                onChange={(e) => handleEditChild(child.localId, "birthday", e.target.value)}
                disabled={!isEditing}
                className="col-span-2 w-full rounded-md border border-gray-300 p-2"
              />
            </div>

            {/* Delete Button */}
            {isEditing && (
              <div className="flex justify-end">
                <button
                  className="rounded-md bg-red-600 px-3 py-2 text-white hover:bg-red-700"
                  onClick={() => handleDeleteChild(child.localId)}
                >
                  Remove Child
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Add Child Button */}
        {isEditing && (
          <div className="flex justify-end">
            <button
              className="mt-6 rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
              onClick={handleAddChild}
            >
              Add New Family Member
            </button>
          </div>
        )}
      </section>

      {/* Save and Cancel Buttons */}
      <div className="mt-8 flex justify-end gap-4">
        {isEditing ? (
          <>
            <button
              className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              onClick={handleCancelChanges}
            >
              Discard Profile Changes
            </button>
            <button
              className="rounded-md bg-[#558552] px-4 py-2 text-white hover:bg-[#488644]"
              onClick={handleSaveChanges}
            >
              Save Profile Changes
            </button>
          </>
        ) : (
          <button className="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700" onClick={handleEditClick}>
            Edit Information
          </button>
        )}
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mt-4 rounded-md bg-red-100 p-3 text-red-700">
          {validationErrors.map((error, idx) => (
            <p key={idx}>{error}</p>
          ))}
        </div>
      )}
    </div>
  );
}
