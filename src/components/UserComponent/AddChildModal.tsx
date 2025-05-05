"use client";
import React, { useState } from "react";
import { Dialog } from "@headlessui/react";
import { Gender } from "./UserInfo";

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (childData: { firstName: string; lastName: string; birthday: string; gender: Gender }) => void;
}

const genderOptions = ["Male", "Female", "Non-binary", "Prefer not to say"];

export default function AddChildModal({ isOpen, onClose, onSubmit }: AddChildModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState<Gender>("");
  const handleAdd = () => {
    if (!firstName || !lastName || !birthday || !gender) {
      alert("All fields are required");
      return;
    }

    onSubmit({ firstName, lastName, birthday, gender });

    // Reset form
    setFirstName("");
    setLastName("");
    setBirthday("");
    setGender("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-md bg-white p-6 shadow-md">
          <Dialog.Title className="mb-4 text-lg font-semibold">Add New Child</Dialog.Title>

          {/* First Name */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="E.g. Sarah"
              className="mt-1 w-full rounded-md border border-gray-300 p-2"
            />
          </div>

          {/* Last Name */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="E.g. Thompson"
              className="mt-1 w-full rounded-md border border-gray-300 p-2"
            />
          </div>

          {/* Birthday */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700">Birthday</label>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 p-2"
            />
          </div>

          {/* Gender */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
              className="mt-1 w-full rounded-md border border-gray-300 p-2"
            >
              <option value="">-- Select --</option>
              {genderOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button onClick={handleAdd} className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              Add Child
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
