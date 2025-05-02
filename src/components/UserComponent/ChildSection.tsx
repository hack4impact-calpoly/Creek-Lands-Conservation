"use client";
import React from "react";

interface Child {
  localId: number;
  _id?: string;
  firstName: string;
  lastName: string;
  birthday: string;
  gender: string;
}

interface ChildSectionProps {
  child: Child;
  isEditing: boolean;
  onEdit: (localId: number, field: keyof Child, value: string) => void;
  onDelete: (localId: number) => void;
}

const genderOptions = ["Male", "Female", "Non-binary", "Prefer not to say"];

export default function ChildSection({ child, isEditing, onEdit, onDelete }: ChildSectionProps) {
  return (
    <section className="mb-6 border-b pb-4">
      <h3 className="mb-2 text-lg font-semibold text-gray-800">Family Member #{child.localId}</h3>

      {/* First Name */}
      <div className="mb-2 grid grid-cols-3 items-center gap-4">
        <label className="text-sm font-medium text-gray-700">First Name</label>
        <input
          type="text"
          value={child.firstName}
          onChange={(e) => onEdit(child.localId, "firstName", e.target.value)}
          disabled={!isEditing}
          placeholder="E.g. Sarah"
          className="col-span-2 w-full rounded-md border border-gray-300 p-2"
        />
      </div>

      {/* Last Name */}
      <div className="mb-2 grid grid-cols-3 items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Last Name</label>
        <input
          type="text"
          value={child.lastName}
          onChange={(e) => onEdit(child.localId, "lastName", e.target.value)}
          disabled={!isEditing}
          placeholder="E.g. Thompson"
          className="col-span-2 w-full rounded-md border border-gray-300 p-2"
        />
      </div>

      {/* Gender */}
      <div className="mb-2 grid grid-cols-3 items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Gender</label>
        <select
          value={child.gender}
          onChange={(e) => onEdit(child.localId, "gender", e.target.value)}
          disabled={!isEditing}
          className="col-span-2 w-full rounded-md border border-gray-300 p-2"
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
      <div className="mb-2 grid grid-cols-3 items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Birthday</label>
        <input
          type="date"
          value={child.birthday}
          onChange={(e) => onEdit(child.localId, "birthday", e.target.value)}
          disabled={!isEditing}
          className="col-span-2 w-full rounded-md border border-gray-300 p-2"
        />
      </div>

      {/* Delete Button */}
      {isEditing && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              onDelete(child.localId);
              window.location.reload();
            }}
            className="mt-2 rounded-md bg-red-600 px-3 py-2 text-white hover:bg-red-700"
          >
            Remove Child
          </button>
        </div>
      )}
    </section>
  );
}
