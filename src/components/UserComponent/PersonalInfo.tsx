"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { LoadingSpinner } from "../ui/loading-spinner";
import PrimaryAccountSection from "@/components/UserComponent/PrimaryAccount";
import ChildSection from "@/components/UserComponent/ChildSection";
import EmergencyContactsSection from "@/components/UserComponent/EmergencyContacts";
import MedicalInfoSection from "@/components/UserComponent/MedicalInfo";
import AddChildModal from "./AddChildModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Child, EmergencyContact, Gender, MedicalInfo } from "@/components/UserComponent/UserInfo";

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

export default function PersonalInfo() {
  const { isLoaded, user } = useUser();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [activeMemberId, setActiveMemberId] = useState("primary");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [birthday, setBirthday] = useState("");
  const [phoneNumbers, setPhoneNumbers] = useState({ cell: "", work: "" });
  const [address, setAddress] = useState({ home: "", city: "", zipCode: "" });

  const [primaryEmergencyContacts, setPrimaryEmergencyContacts] = useState<EmergencyContact[]>([
    { name: "", phone: "", work: "", relationship: "", canPickup: false },
    { name: "", phone: "", work: "", relationship: "", canPickup: false },
  ]);

  const [primaryMedicalInfo, setPrimaryMedicalInfo] = useState<MedicalInfo>(defaultMedicalInfo);

  const [children, setChildren] = useState<Child[]>([]);
  const [showModal, setShowModal] = useState(false);

  const selectedChild =
    activeMemberId !== "primary"
      ? children.find((c) => (c.localId?.toString?.() || c._id?.toString?.()) === activeMemberId)
      : null;

  useEffect(() => {
    if (!isLoaded || !user?.id) {
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        const res = await fetch(`/api/users/${user.id}`);
        const data = await res.json();
        if (!data || !data._id) throw new Error("User not found in database.");

        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setEmail(data.email || "");
        setGender(data.gender || "");
        setBirthday(data.birthday?.split("T")[0] || "");
        setPhoneNumbers(data.phoneNumbers || { cell: "", work: "" });
        setAddress(data.address || { home: "", city: "", zipCode: "" });
        setPrimaryEmergencyContacts(
          (data.emergencyContacts || []).slice(0, 2).concat(
            Array(2 - (data.emergencyContacts?.length || 0)).fill({
              name: "",
              phone: "",
              work: "",
              relationship: "",
              canPickup: false,
            }),
          ),
        );
        setPrimaryMedicalInfo(data.medicalInfo || defaultMedicalInfo);

        const parsedChildren = (data.children || []).map((c: any, i: number) => ({
          ...c,
          localId: i + 1,
          birthday: c.birthday?.split("T")[0] || "",
          emergencyContacts: (c.emergencyContacts || []).slice(0, 2).concat(
            Array(2 - (c.emergencyContacts?.length || 0)).fill({
              name: "",
              phone: "",
              work: "",
              relationship: "",
              canPickup: false,
            }),
          ),
          medicalInfo: c.medicalInfo || defaultMedicalInfo,
        }));

        setChildren(parsedChildren);
      } catch (err) {
        setError("Failed to load user data.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isLoaded, user]);

  const handlePhoneChange = (field: "cell" | "work", value: string) => {
    setPhoneNumbers((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async () => {
    try {
      const payload = {
        firstName,
        lastName,
        gender,
        birthday,
        phoneNumbers,
        address,
        emergencyContacts: primaryEmergencyContacts,
        medicalInfo: primaryMedicalInfo,
        children,
      };

      const res = await fetch(`/api/users/${user?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Update failed");

      setEditingMemberId(null);
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  const handleAddChild = async (childData: {
    firstName: string;
    lastName: string;
    birthday: string;
    gender: Gender;
  }) => {
    try {
      const res = await fetch(`/api/users/${user?.id}/child`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...childData,
          emergencyContacts: primaryEmergencyContacts,
          medicalInfo: defaultMedicalInfo,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Child creation failed");

      setChildren((prev) => [...prev, { ...result.child, localId: prev.length + 1 }]);
    } catch (err) {
      console.error("Failed to add child:", err);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;
  if (error) return <p className="text-red-500">{error}</p>;

  const familyMembers = [
    { id: "primary", name: `${firstName} ${lastName}`, type: "Primary" },
    ...children.map((c) => ({ id: c.localId?.toString() || "", name: `${c.firstName} ${c.lastName}`, type: "Child" })),
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h2 className="mb-6 text-3xl font-semibold text-gray-800">Account Information</h2>

      <div className="mb-6">
        <label htmlFor="profile-select" className="mb-1 block text-sm font-medium text-gray-700">
          Select Profile
        </label>
        <Select value={activeMemberId} onValueChange={setActiveMemberId}>
          <SelectTrigger id="profile-select" className="w-full">
            <SelectValue placeholder="Select a profile" />
          </SelectTrigger>
          <SelectContent>
            {familyMembers.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name} {member.type === "Primary" ? "(Primary)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-4 mt-4 flex items-center justify-between">
        <div className="flex gap-4">
          {editingMemberId === activeMemberId ? (
            <>
              <button
                onClick={handleSaveChanges}
                className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
              >
                Save
              </button>
              <button
                onClick={() => setEditingMemberId(null)}
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

        <button
          onClick={() => setShowModal(true)}
          className="mt-6 rounded-md bg-navy-tertiary px-4 py-2 text-white hover:opacity-90"
        >
          Add New Family Member
        </button>
      </div>

      <AddChildModal isOpen={showModal} onClose={() => setShowModal(false)} onSubmit={handleAddChild} />

      {activeMemberId === "primary" ? (
        <>
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
          <EmergencyContactsSection
            isEditing={editingMemberId === activeMemberId}
            contacts={primaryEmergencyContacts}
            onUpdate={(index, updatedContact) => {
              const updated = [...primaryEmergencyContacts];
              updated[index] = updatedContact;
              setPrimaryEmergencyContacts(updated.slice(0, 2));
            }}
          />

          <MedicalInfoSection
            isEditing={editingMemberId === activeMemberId}
            data={primaryMedicalInfo}
            onUpdate={setPrimaryMedicalInfo}
          />
        </>
      ) : (
        selectedChild && (
          <>
            <ChildSection
              child={selectedChild}
              isEditing={editingMemberId === activeMemberId}
              onEdit={(id, field, value) =>
                setChildren((prev) => prev.map((c) => (c.localId === id ? { ...c, [field]: value } : c)))
              }
              onDelete={(id) => setChildren((prev) => prev.filter((c) => c.localId !== id))}
            />
            <EmergencyContactsSection
              isEditing={editingMemberId === activeMemberId}
              contacts={selectedChild.emergencyContacts}
              onUpdate={(index, updatedContact) => {
                setChildren((prev) =>
                  prev.map((child) =>
                    child.localId === selectedChild.localId
                      ? {
                          ...child,
                          emergencyContacts: child.emergencyContacts
                            .map((c, i) => (i === index ? updatedContact : c))
                            .slice(0, 2),
                        }
                      : child,
                  ),
                );
              }}
            />

            <MedicalInfoSection
              isEditing={editingMemberId === activeMemberId}
              data={selectedChild.medicalInfo || defaultMedicalInfo}
              onUpdate={(updated) => {
                setChildren((prev) =>
                  prev.map((c) => (c.localId === selectedChild.localId ? { ...c, medicalInfo: updated } : c)),
                );
              }}
            />
          </>
        )
      )}
    </div>
  );
}
