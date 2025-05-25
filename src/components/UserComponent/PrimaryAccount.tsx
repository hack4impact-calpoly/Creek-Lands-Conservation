"use client";
import React from "react";

interface PrimaryAccountProps {
  firstName: string;
  lastName: string;
  gender: string;
  birthday: string;
  phoneNumbers: { cell: string; work: string };
  isEditing: boolean;
  onChange: (field: string, value: string) => void;
  onPhoneChange: (field: "cell" | "work", value: string) => void;
}

const genderOptions = ["Male", "Female", "Non-binary", "Prefer not to say"];

export default function PrimaryAccountSection({
  firstName,
  lastName,
  gender,
  birthday,
  phoneNumbers,
  isEditing,
  onChange,
  onPhoneChange,
}: PrimaryAccountProps) {
  return (
    <section className="mb-8">
      <h3 className="mb-4 text-xl font-semibold text-gray-700">Primary Account Holder Information</h3>
      <div className="space-y-4">
        {/* First Name */}
        <div className="grid grid-cols-3 items-center gap-4">
          <label className="text-sm font-medium text-gray-700">First Name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => onChange("firstName", e.target.value)}
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
            onChange={(e) => onChange("lastName", e.target.value)}
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
            onChange={(e) => onChange("gender", e.target.value)}
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
            value={birthday}
            onChange={(e) => onChange("birthday", e.target.value)}
            disabled={!isEditing}
            className="col-span-2 w-full rounded-md border border-gray-300 p-2"
          />
        </div>

        {/* Cell Phone */}
        <div className="grid grid-cols-3 items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Cell Phone</label>
          <input
            type="text"
            value={phoneNumbers.cell}
            onChange={(e) => onPhoneChange("cell", e.target.value)}
            disabled={!isEditing}
            placeholder="(805) 123-4567"
            className="col-span-2 w-full rounded-md border border-gray-300 p-2"
          />
        </div>

        {/* Work Phone */}
        <div className="grid grid-cols-3 items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Work Phone</label>
          <input
            type="text"
            value={phoneNumbers.work}
            onChange={(e) => onPhoneChange("work", e.target.value)}
            disabled={!isEditing}
            placeholder="(805) 987-6543"
            className="col-span-2 w-full rounded-md border border-gray-300 p-2"
          />
        </div>
      </div>
    </section>
  );
}
