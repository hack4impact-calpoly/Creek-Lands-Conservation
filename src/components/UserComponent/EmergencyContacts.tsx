"use client";
import React from "react";

interface EmergencyContact {
  name: string;
  phone: string;
  work: string;
  relationship: string;
  canPickup: boolean;
}

interface EmergencyContactsSectionProps {
  isEditing: boolean;
  contacts: EmergencyContact[];
  onUpdate: (index: number, contact: EmergencyContact) => void;
}

export default function EmergencyContactsSection({ contacts, isEditing, onUpdate }: EmergencyContactsSectionProps) {
  return (
    <section className="mt-10">
      <h3 className="mb-4 text-xl font-semibold">Emergency Contacts</h3>

      {Array.isArray(contacts) &&
        contacts.map((contact, index) => (
          <div key={index} className="mb-6 space-y-4 border-b pb-4">
            <div className="text-lg font-semibold">Contact #{index + 1}</div>

            {/* Name */}
            <div className="grid grid-cols-3 items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={contact.name}
                onChange={(e) => onUpdate(index, { ...contact, name: e.target.value })}
                disabled={!isEditing}
                className="col-span-2 w-full rounded-md border border-gray-300 p-2"
              />
            </div>

            {/* Phone */}
            <div className="grid grid-cols-3 items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="text"
                value={contact.phone}
                onChange={(e) => onUpdate(index, { ...contact, phone: e.target.value })}
                disabled={!isEditing}
                className="col-span-2 w-full rounded-md border border-gray-300 p-2"
              />
            </div>

            {/* Work */}
            <div className="grid grid-cols-3 items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Work Number</label>
              <input
                type="text"
                value={contact.work}
                onChange={(e) => onUpdate(index, { ...contact, work: e.target.value })}
                disabled={!isEditing}
                className="col-span-2 w-full rounded-md border border-gray-300 p-2"
              />
            </div>

            {/* Relationship */}
            <div className="grid grid-cols-3 items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Relationship</label>
              <input
                type="text"
                value={contact.relationship}
                onChange={(e) => onUpdate(index, { ...contact, relationship: e.target.value })}
                disabled={!isEditing}
                className="col-span-2 w-full rounded-md border border-gray-300 p-2"
              />
            </div>

            {/* Can Pick Up */}
            <div className="grid grid-cols-3 items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Can Pick Up?</label>
              <div className="col-span-2 flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={contact.canPickup === true}
                    disabled={!isEditing}
                    onChange={() => onUpdate(index, { ...contact, canPickup: true })}
                  />
                  Yes
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={contact.canPickup === false}
                    disabled={!isEditing}
                    onChange={() => onUpdate(index, { ...contact, canPickup: false })}
                  />
                  No
                </label>
              </div>
            </div>
          </div>
        ))}
    </section>
  );
}
