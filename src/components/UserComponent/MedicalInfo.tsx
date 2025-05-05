"use client";
import React from "react";

interface MedicalInfo {
  photoRelease: boolean;
  allergies: string;
  insurance: string;
  doctorName: string;
  doctorPhone: string;
  behaviorNotes: string;
  dietaryRestrictions: string;
  otherNotes: string;
}

interface MedicalInfoSectionProps {
  data: MedicalInfo;
  isEditing: boolean;
  onUpdate: (updated: MedicalInfo) => void;
}

export default function MedicalInfoSection({ data, isEditing, onUpdate }: MedicalInfoSectionProps) {
  return (
    <section className="mt-10">
      <h3 className="mb-4 text-xl font-semibold text-gray-800">Important Note</h3>
      <p className="mb-2 text-sm text-gray-700">
        In an emergency, sudden illness or unwellness, or serious behavior violation, students who cannot be immediately
        picked up by a guardian or emergency contact may stay on our bus or other vehicle with a chaperone until they
        can be picked up...
      </p>

      <h3 className="mb-2 mt-8 text-xl font-semibold text-gray-800">Photo Release</h3>
      <p className="mb-4 text-sm text-gray-700">
        I hereby further consent that any photograph in which my child or ward appears... may be used by Creek Lands
        Conservation...
      </p>

      <div className="space-y-4">
        {/* Photo Release */}
        <div className="grid grid-cols-3 items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Photo Release</label>
          <div className="col-span-2 flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={data.photoRelease === true}
                disabled={!isEditing}
                onChange={() => onUpdate({ ...data, photoRelease: true })}
              />
              Yes
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={data.photoRelease === false}
                disabled={!isEditing}
                onChange={() => onUpdate({ ...data, photoRelease: false })}
              />
              No
            </label>
          </div>
        </div>

        {/* Allergies */}
        <div className="grid grid-cols-3 items-start gap-4">
          <label className="text-sm font-medium text-gray-700">Allergies or Medications</label>
          <textarea
            rows={2}
            value={data.allergies}
            onChange={(e) => onUpdate({ ...data, allergies: e.target.value })}
            disabled={!isEditing}
            placeholder="E.g. Allergic to bees and peanut butter, carries an epipen."
            className="col-span-2 w-full rounded-md border border-gray-300 p-2"
          />
        </div>

        {/* Insurance Provider */}
        <div className="grid grid-cols-3 items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Health Insurance Provider</label>
          <input
            type="text"
            value={data.insurance}
            onChange={(e) => onUpdate({ ...data, insurance: e.target.value })}
            disabled={!isEditing}
            placeholder="E.g. Cigna, Anthem Blue Cross"
            className="col-span-2 w-full rounded-md border border-gray-300 p-2"
          />
        </div>

        {/* Doctor Name */}
        <div className="grid grid-cols-3 items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Doctor Name</label>
          <input
            type="text"
            value={data.doctorName}
            onChange={(e) => onUpdate({ ...data, doctorName: e.target.value })}
            disabled={!isEditing}
            placeholder="Dr. John Kim"
            className="col-span-2 w-full rounded-md border border-gray-300 p-2"
          />
        </div>

        {/* Doctor Phone */}
        <div className="grid grid-cols-3 items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Doctor Phone Number</label>
          <input
            type="text"
            value={data.doctorPhone}
            onChange={(e) => onUpdate({ ...data, doctorPhone: e.target.value })}
            disabled={!isEditing}
            placeholder="(805) 123-4567"
            className="col-span-2 w-full rounded-md border border-gray-300 p-2"
          />
        </div>

        {/* Behavior Notes */}
        <div className="grid grid-cols-3 items-start gap-4">
          <label className="text-sm font-medium text-gray-700">Behavior Notes / Support Needs</label>
          <textarea
            rows={2}
            value={data.behaviorNotes}
            onChange={(e) => onUpdate({ ...data, behaviorNotes: e.target.value })}
            disabled={!isEditing}
            placeholder="Can be stubborn when it comes to trying new things..."
            className="col-span-2 w-full rounded-md border border-gray-300 p-2"
          />
        </div>

        {/* Dietary Restrictions */}
        <div className="grid grid-cols-3 items-start gap-4">
          <label className="text-sm font-medium text-gray-700">Dietary Restrictions</label>
          <textarea
            rows={2}
            value={data.dietaryRestrictions}
            onChange={(e) => onUpdate({ ...data, dietaryRestrictions: e.target.value })}
            disabled={!isEditing}
            placeholder="E.g. vegetarian"
            className="col-span-2 w-full rounded-md border border-gray-300 p-2"
          />
        </div>

        {/* Other Notes */}
        <div className="grid grid-cols-3 items-start gap-4">
          <label className="text-sm font-medium text-gray-700">Additional Notes</label>
          <textarea
            rows={2}
            value={data.otherNotes}
            onChange={(e) => onUpdate({ ...data, otherNotes: e.target.value })}
            disabled={!isEditing}
            placeholder="Anything else we should know..."
            className="col-span-2 w-full rounded-md border border-gray-300 p-2"
          />
        </div>
      </div>
    </section>
  );
}
