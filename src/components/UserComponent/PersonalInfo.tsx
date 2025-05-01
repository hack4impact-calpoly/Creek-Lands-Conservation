// Main PersonalInfo.tsx with dropdown-based profile switching and modular layout

"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { LoadingSpinner } from "../ui/loading-spinner";
import PrimaryAccountSection from "@/components/UserComponent/PrimaryAccount";
import ChildSection from "@/components/UserComponent/ChildSection";
import EmergencyContactsSection from "@/components/UserComponent/EmergencyContacts";
import MedicalInfoSection from "@/components/UserComponent/MedicalInfo";
import AddChildModal from "./AddChildModal";

// TODO: GuardianSection if needed

import type { Child, NewChild, Guardian, EmergencyContact, MedicalInfo } from "@/components/UserComponent/UserInfo";

const genderOptions = ["Male", "Female", "Non-binary", "Prefer not to say"];
let localChildCounter = 0;

export default function PersonalInfo() {
  const { isLoaded, user } = useUser();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [birthday, setBirthday] = useState("");
  const [phoneNumbers, setPhoneNumbers] = useState({ cell: "", work: "" });
  const [address, setAddress] = useState({ home: "", city: "", zipCode: "" });
  const [children, setChildren] = useState<Child[]>([]);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { name: "", phone: "", work: "", relationship: "", canPickup: false },
    { name: "", phone: "", work: "", relationship: "", canPickup: false },
  ]);

  const [showModal, setShowModal] = useState(false);

  const handleAddChild = (newChild: NewChild) => {
    localChildCounter += 1;
    setChildren((prev) => [
      ...prev,
      {
        localId: localChildCounter,
        ...newChild,
        _id: "",
      },
    ]);
  };

  const defaultMedicalInfo: MedicalInfo = {
    photoRelease: false,
    allergies: "",
    insurance: "",
    doctorName: "",
    doctorPhone: "",
    behaviorNotes: "",
    dietaryRestrictions: "",
    otherNotes: "",
  };

  const [medicalInfoMap, setMedicalInfoMap] = useState<Record<string, MedicalInfo>>({});

  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  const [activeMemberId, setActiveMemberId] = useState("primary");

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isLoaded || !user?.id) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/users/${user.id}`);
        const userData = await response.json();

        if (!userData || !userData._id) {
          setError("User not found in MongoDB.");
          return;
        }

        setFirstName(userData.firstName || "");
        setLastName(userData.lastName || "");
        setEmail(userData.email || "");
        setGender(userData.gender || "");
        setBirthday(userData.birthday?.split("T")[0] || "");
        setPhoneNumbers(userData.phoneNumbers || { cell: "", work: "" });
        setAddress(userData.address || { home: "", city: "", zipCode: "" });

        const mappedChildren = (userData.children || []).map((child: any) => ({
          localId: ++localChildCounter,
          _id: child._id,
          firstName: child.firstName,
          lastName: child.lastName,
          birthday: child.birthday?.split("T")[0] || "",
          gender: child.gender,
        }));
        setChildren(mappedChildren);
      } catch (err) {
        setError("Failed to load user data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isLoaded, user]);

  const familyMembers = [
    {
      type: "Primary",
      name: `${firstName} ${lastName}`,
      id: "primary",
    },
    ...children.map((child) => ({
      type: "Child",
      name: `${child.firstName} ${child.lastName}`,
      id: child.localId.toString(),
    })),
  ];

  const selectedChild =
    activeMemberId !== "primary" ? children.find((c) => c.localId.toString() === activeMemberId) : null;

  const handlePhoneChange = (field: "cell" | "work", value: string) => {
    setPhoneNumbers((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) return <LoadingSpinner size="lg" />;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h2 className="mb-6 text-3xl font-semibold text-gray-800">Account Information</h2>

      <div className="mb-6">
        <label className="mb-1 block text-sm font-medium text-gray-700">Select Profile</label>
        <select
          value={activeMemberId}
          onChange={(e) => setActiveMemberId(e.target.value)}
          className="w-full rounded-md border border-gray-300 p-2"
        >
          {familyMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name || "Unnamed"} {member.type === "Primary" ? "(Primary)" : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4 mt-4 flex items-center justify-between">
        {activeMemberId && (
          <div className="mt-4 flex gap-4">
            {editingMemberId === activeMemberId ? (
              <>
                <button
                  onClick={() => {
                    // Save logic here
                    setEditingMemberId(null);
                  }}
                  className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    // Cancel logic here
                    setEditingMemberId(null);
                  }}
                  className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditingMemberId(activeMemberId)}
                className="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
              >
                Edit {activeMemberId === "primary" ? "Primary Account" : "Member"}
              </button>
            )}
          </div>
        )}

        <button
          className="mt-6 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          onClick={() => setShowModal(true)}
        >
          ➕ Add New Child
        </button>

        <AddChildModal isOpen={showModal} onClose={() => setShowModal(false)} onSubmit={handleAddChild} />
      </div>

      {activeMemberId === "primary" && (
        <PrimaryAccountSection
          isEditing={editingMemberId === activeMemberId}
          firstName={firstName}
          lastName={lastName}
          gender={gender}
          birthday={birthday}
          phoneNumbers={phoneNumbers}
          onChange={(field, value) => {
            if (field === "firstName") setFirstName(value);
            if (field === "lastName") setLastName(value);
            if (field === "gender") setGender(value);
            if (field === "birthday") setBirthday(value);
          }}
          onPhoneChange={handlePhoneChange}
        />
      )}

      {selectedChild && (
        <ChildSection
          child={selectedChild}
          isEditing={editingMemberId === activeMemberId}
          onEdit={(id, field, value) => {
            setChildren((prev) => prev.map((c) => (c.localId === id ? { ...c, [field]: value } : c)));
          }}
          onDelete={(id) => {
            setChildren((prev) => prev.filter((c) => c.localId !== id));
          }}
        />
      )}

      <MedicalInfoSection
        isEditing={editingMemberId === activeMemberId}
        data={medicalInfoMap[activeMemberId] ?? defaultMedicalInfo}
        onUpdate={(updated) => {
          setMedicalInfoMap((prev) => ({
            ...prev,
            [activeMemberId]: updated,
          }));
        }}
      />

      <EmergencyContactsSection
        isEditing={editingMemberId === activeMemberId}
        contacts={emergencyContacts}
        onUpdate={(index, updated) => {
          const newContacts = [...emergencyContacts];
          newContacts[index] = updated;
          setEmergencyContacts(newContacts);
        }}
      />
    </div>
  );
}
