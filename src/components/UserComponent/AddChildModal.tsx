"use client";
import React, { useState } from "react";
import type { NewChild } from "./UserInfo";

type AddChildModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (child: NewChild) => void;
};

const genderOptions = ["Male", "Female", "Non-binary", "Prefer not to say"];

export default function AddChildModal({ isOpen, onClose, onSubmit }: AddChildModalProps) {
  const [form, setForm] = useState<NewChild>({
    firstName: "",
    lastName: "",
    gender: "",
    birthday: "",
  });

  const handleChange = (field: keyof NewChild, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSubmit(form);
    onClose(); // Close after adding
    setForm({ firstName: "", lastName: "", gender: "", birthday: "" }); // Reset
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="w-full max-w-md rounded-md bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-semibold">Add New Family Member</h2>

        {/* First Name */}
        <input
          type="text"
          value={form.firstName}
          onChange={(e) => handleChange("firstName", e.target.value)}
          placeholder="First Name"
          className="mb-3 w-full rounded border border-gray-300 p-2"
        />

        {/* Last Name */}
        <input
          type="text"
          value={form.lastName}
          onChange={(e) => handleChange("lastName", e.target.value)}
          placeholder="Last Name"
          className="mb-3 w-full rounded border border-gray-300 p-2"
        />

        {/* Gender */}
        <select
          value={form.gender}
          onChange={(e) => handleChange("gender", e.target.value)}
          className="mb-3 w-full rounded border border-gray-300 p-2"
        >
          <option value="">-- Select Gender --</option>
          {genderOptions.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>

        {/* Birthday */}
        <input
          type="date"
          value={form.birthday}
          onChange={(e) => handleChange("birthday", e.target.value)}
          className="mb-4 w-full rounded border border-gray-300 p-2"
        />

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="rounded bg-gray-300 px-4 py-2 hover:bg-gray-400">
            Cancel
          </button>
          <button onClick={handleSubmit} className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700">
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
