"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PrimaryAccountSection } from "@/components/UserComponent/PrimaryAccountSection";
import { FamilyMemberSection } from "@/components/UserComponent/FamilyMemberSection";
import { EmergencyContactsSection } from "@/components/UserComponent/EmergencyContactsSection";
import { MedicalInfoSection } from "@/components/UserComponent/MedicalInfoSection";
import { AddFamilyMemberDialog } from "@/components/UserComponent/AddFamilyMemberDialog";
import { useToast } from "@/hooks/use-toast";
import { User, UserPlus, Edit3, Save, X } from "lucide-react";
import { AddressSection } from "@/components/UserComponent/AddressSection";
import { ConsentSection } from "@/components/UserComponent/ConsentSection";

export type Gender = "" | "Male" | "Female" | "Non-binary" | "Prefer not to say";

export interface Child {
  localId: number;
  _id?: string;
  firstName: string;
  lastName: string;
  birthday: string;
  gender: Gender;
  address?: {
    home: string;
    city: string;
    zipCode: string;
  };
  usePrimaryAddress: boolean;
  emergencyContacts: EmergencyContact[];
  usePrimaryEmergencyContacts: boolean;
  medicalInfo: MedicalInfo;
  photoRelease: boolean;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  work: string;
  relationship: string;
  canPickup: boolean;
}

export interface MedicalInfo {
  allergies: string;
  insurance: string;
  doctorName: string;
  doctorPhone: string;
  behaviorNotes: string;
  dietaryRestrictions: string;
}

const defaultMedicalInfo: MedicalInfo = {
  allergies: "",
  insurance: "",
  doctorName: "",
  doctorPhone: "",
  behaviorNotes: "",
  dietaryRestrictions: "",
};

export default function PersonalInfoPage() {
  const { isLoaded, user } = useUser();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("primary");
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Primary account data
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState<Gender>("");
  const [birthday, setBirthday] = useState("");
  const [phoneNumbers, setPhoneNumbers] = useState({ cell: "", work: "" });
  const [address, setAddress] = useState({ home: "", city: "", zipCode: "" });

  const [primaryEmergencyContacts, setPrimaryEmergencyContacts] = useState<EmergencyContact[]>([
    { name: "", phone: "", work: "", relationship: "", canPickup: false },
    { name: "", phone: "", work: "", relationship: "", canPickup: false },
  ]);

  const [primaryMedicalInfo, setPrimaryMedicalInfo] = useState<MedicalInfo>(defaultMedicalInfo);
  const [primaryPhotoRelease, setPrimaryPhotoRelease] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);

  // Load user data
  useEffect(() => {
    if (!isLoaded || !user?.id) {
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        const res = await fetch(`/api/users/${user.id}`);
        const data = await res.json();

        if (!data || !data._id) {
          throw new Error("User not found in database.");
        }

        // Set primary account data
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setEmail(data.email || "");
        setGender(data.gender || "");
        setBirthday(data.birthday?.split("T")[0] || "");
        setPhoneNumbers(data.phoneNumbers || { cell: "", work: "" });
        setAddress(data.address || { home: "", city: "", zipCode: "" });

        // Set emergency contacts
        const contacts = data.emergencyContacts || [];
        setPrimaryEmergencyContacts([
          contacts[0] || { name: "", phone: "", work: "", relationship: "", canPickup: false },
          contacts[1] || { name: "", phone: "", work: "", relationship: "", canPickup: false },
        ]);

        setPrimaryMedicalInfo({
          allergies: data.medicalInfo?.allergies || "",
          insurance: data.medicalInfo?.insurance || "",
          doctorName: data.medicalInfo?.doctorName || "",
          doctorPhone: data.medicalInfo?.doctorPhone || "",
          behaviorNotes: data.medicalInfo?.behaviorNotes || "",
          dietaryRestrictions: data.medicalInfo?.dietaryRestrictions || "",
        });
        setPrimaryPhotoRelease(data.medicalInfo?.photoRelease || false);

        // Set children data
        const parsedChildren = (data.children || []).map((c: any, i: number) => ({
          ...c,
          localId: i + 1,
          birthday: c.birthday?.split("T")[0] || "",
          address: c.address || { home: "", city: "", zipCode: "" },
          usePrimaryAddress: !c.address?.home, // If no address, default to using primary
          emergencyContacts: [
            c.emergencyContacts?.[0] || { name: "", phone: "", work: "", relationship: "", canPickup: false },
            c.emergencyContacts?.[1] || { name: "", phone: "", work: "", relationship: "", canPickup: false },
          ],
          usePrimaryEmergencyContacts: !c.emergencyContacts?.length, // If no contacts, default to using primary
          medicalInfo: {
            allergies: c.medicalInfo?.allergies || "",
            insurance: c.medicalInfo?.insurance || "",
            doctorName: c.medicalInfo?.doctorName || "",
            doctorPhone: c.medicalInfo?.doctorPhone || "",
            behaviorNotes: c.medicalInfo?.behaviorNotes || "",
            dietaryRestrictions: c.medicalInfo?.dietaryRestrictions || "",
          },
          photoRelease: c.medicalInfo?.photoRelease || false,
        }));

        setChildren(parsedChildren);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load user data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isLoaded, user]);

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
        medicalInfo: { ...primaryMedicalInfo, photoRelease: primaryPhotoRelease },
        children,
      };

      const res = await fetch(`/api/users/${user?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Update failed");

      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your changes have been saved successfully.",
      });
    } catch (err) {
      console.error("Save failed:", err);
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddFamilyMember = async (memberData: {
    firstName: string;
    lastName: string;
    birthday: string;
    gender: Gender;
  }) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Adding new family member:", memberData);
      const response = await fetch(`/api/users/${user.id}/child`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memberData),
      });

      const result = await response.json();
      if (!response.ok) {
        console.log("Add child failed with error:", result.error);
        throw new Error(result.error || "Failed to add family member");
      }

      console.log("Child added successfully:", result.child);
      const newChild: Child = {
        ...result.child,
        localId: children.length + 1,
        birthday: result.child.birthday?.split("T")[0] || memberData.birthday,
        address: result.child.address || { home: "", city: "", zipCode: "" },
        usePrimaryAddress: !result.child.address?.home,
        emergencyContacts: result.child.emergencyContacts || [
          { name: "", phone: "", work: "", relationship: "", canPickup: false },
          { name: "", phone: "", work: "", relationship: "", canPickup: false },
        ],
        usePrimaryEmergencyContacts: !result.child.emergencyContacts?.length,
        medicalInfo: {
          allergies: result.child.medicalInfo?.allergies || "",
          insurance: result.child.medicalInfo?.insurance || "",
          doctorName: result.child.medicalInfo?.doctorName || "",
          doctorPhone: result.child.medicalInfo?.doctorPhone || "",
          behaviorNotes: result.child.medicalInfo?.behaviorNotes || "",
          dietaryRestrictions: result.child.medicalInfo?.dietaryRestrictions || "",
        },
        photoRelease: result.child.medicalInfo?.photoRelease || false,
      };

      setChildren((prev) => [...prev, newChild]);
      setShowAddDialog(false);

      toast({
        title: "Family Member Added",
        description: `${memberData.firstName} ${memberData.lastName} has been added successfully.`,
      });
    } catch (err) {
      console.error("Failed to add family member:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to add family member. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFamilyMember = async (localId: number, childId?: string) => {
    const child = children.find((c) => c.localId === localId);
    if (!child) {
      console.log(`Child with localId ${localId} not found`);
      return;
    }

    if (!childId) {
      console.log(`Child with localId ${localId} has no _id, removing locally only`);
      if (confirm(`Are you sure you want to remove ${child.firstName} ${child.lastName}?`)) {
        setChildren((prev) => prev.filter((c) => c.localId !== localId));
        if (activeTab === `child-${localId}`) {
          setActiveTab("primary");
        }
        toast({
          title: "Family Member Removed",
          description: `${child.firstName} ${child.lastName} has been removed successfully.`,
        });
      }
      return;
    }

    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log(`Deleting child with ID: ${childId}`);
      const response = await fetch(`/api/users/${user.id}/child/${childId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();
      if (!response.ok) {
        console.log("Delete child failed with error:", result.error);
        throw new Error(result.error || "Failed to delete family member");
      }

      console.log("Child deleted successfully:", result);
      setChildren((prev) => prev.filter((c) => c.localId !== localId));
      if (activeTab === `child-${localId}`) {
        setActiveTab("primary");
      }

      toast({
        title: "Family Member Removed",
        description: `${child.firstName} ${child.lastName} has been removed successfully.`,
      });
    } catch (err) {
      console.error("Failed to delete family member:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete family member. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mx-auto mt-8 max-w-md">
        <CardContent className="pt-6">
          <p className="text-center text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Account Information</h1>
          <p className="mt-2 text-gray-600">Manage your personal and family information</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setShowAddDialog(true)} variant="outline" className="gap-2">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Family Member</span>
            <span className="sm:hidden">Add Member</span>
          </Button>

          {isEditing ? (
            <>
              <Button onClick={handleSaveChanges} className="gap-2">
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline">Save Changes</span>
                <span className="sm:hidden">Save</span>
              </Button>
              <Button onClick={() => setIsEditing(false)} variant="outline" className="gap-2">
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">Cancel</span>
                <span className="sm:hidden">Cancel</span>
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2">
              <Edit3 className="h-4 w-4" />
              <span className="hidden sm:inline">Edit Information</span>
              <span className="sm:hidden">Edit</span>
            </Button>
          )}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="mb-3 text-sm font-medium text-gray-500">Family Members</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeTab === "primary" ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-2"
            onClick={() => setActiveTab("primary")}
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">
              {firstName} {lastName}
            </span>
            <span className="sm:hidden">
              {firstName.charAt(0)}
              {lastName.charAt(0)}
            </span>
            <Badge variant="secondary" className="ml-1">
              Primary
            </Badge>
          </Button>

          {children.map((child) => (
            <Button
              key={child.localId}
              variant={activeTab === `child-${child.localId}` ? "default" : "outline"}
              size="sm"
              className="flex items-center gap-2"
              onClick={() => setActiveTab(`child-${child.localId}`)}
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">
                {child.firstName} {child.lastName}
              </span>
              <span className="sm:hidden">
                {child.firstName.charAt(0)}
                {child.lastName.charAt(0)}
              </span>
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {activeTab === "primary" && (
          <div className="space-y-6">
            <PrimaryAccountSection
              firstName={firstName}
              lastName={lastName}
              gender={gender}
              birthday={birthday}
              phoneNumbers={phoneNumbers}
              address={address}
              isEditing={isEditing}
              onChange={(field, value) => {
                if (field === "firstName") setFirstName(value);
                if (field === "lastName") setLastName(value);
                if (field === "gender") setGender(value as Gender);
                if (field === "birthday") setBirthday(value);
              }}
              onPhoneChange={(field, value) => {
                setPhoneNumbers((prev) => ({ ...prev, [field]: value }));
              }}
              onAddressChange={(field, value) => {
                setAddress((prev) => ({ ...prev, [field]: value }));
              }}
            />

            <Separator />

            <AddressSection
              address={address}
              usePrimaryAddress={false}
              primaryAddress={address}
              isEditing={isEditing}
              onAddressChange={(field, value) => {
                setAddress((prev) => ({ ...prev, [field]: value }));
              }}
              onUsePrimaryChange={() => {}}
              showPrimaryOption={false}
            />

            <Separator />

            <EmergencyContactsSection
              contacts={primaryEmergencyContacts}
              usePrimaryContacts={false}
              primaryContacts={primaryEmergencyContacts}
              isEditing={isEditing}
              onUpdate={(index, contact) => {
                const updated = [...primaryEmergencyContacts];
                updated[index] = contact;
                setPrimaryEmergencyContacts(updated);
              }}
              onUsePrimaryChange={() => {}}
              showPrimaryOption={false}
            />

            <Separator />

            <ConsentSection
              photoRelease={primaryPhotoRelease}
              isEditing={isEditing}
              onUpdate={setPrimaryPhotoRelease}
            />

            <Separator />

            <MedicalInfoSection data={primaryMedicalInfo} isEditing={isEditing} onUpdate={setPrimaryMedicalInfo} />
          </div>
        )}

        {children.map(
          (child) =>
            activeTab === `child-${child.localId}` && (
              <div key={child.localId} className="space-y-6">
                <FamilyMemberSection
                  child={child}
                  isEditing={isEditing}
                  onEdit={(id, field, value) => {
                    setChildren((prev) => prev.map((c) => (c.localId === id ? { ...c, [field]: value } : c)));
                  }}
                  onDelete={handleDeleteFamilyMember}
                />

                <Separator />

                <AddressSection
                  address={child.address || { home: "", city: "", zipCode: "" }}
                  usePrimaryAddress={child.usePrimaryAddress}
                  primaryAddress={address}
                  isEditing={isEditing}
                  onAddressChange={(field, value) => {
                    setChildren((prev) =>
                      prev.map((c) =>
                        c.localId === child.localId
                          ? {
                              ...c,
                              address: {
                                ...(c.address || { home: "", city: "", zipCode: "" }),
                                [field]: value,
                              },
                            }
                          : c,
                      ),
                    );
                  }}
                  onUsePrimaryChange={(usePrimary) => {
                    setChildren((prev) =>
                      prev.map((c) => (c.localId === child.localId ? { ...c, usePrimaryAddress: usePrimary } : c)),
                    );
                  }}
                  showPrimaryOption={true}
                />

                <Separator />

                <EmergencyContactsSection
                  contacts={child.emergencyContacts}
                  usePrimaryContacts={child.usePrimaryEmergencyContacts}
                  primaryContacts={primaryEmergencyContacts}
                  isEditing={isEditing}
                  onUpdate={(index, contact) => {
                    setChildren((prev) =>
                      prev.map((c) =>
                        c.localId === child.localId
                          ? {
                              ...c,
                              emergencyContacts: c.emergencyContacts.map((ec, i) => (i === index ? contact : ec)),
                            }
                          : c,
                      ),
                    );
                  }}
                  onUsePrimaryChange={(usePrimary) => {
                    setChildren((prev) =>
                      prev.map((c) =>
                        c.localId === child.localId ? { ...c, usePrimaryEmergencyContacts: usePrimary } : c,
                      ),
                    );
                  }}
                  showPrimaryOption={true}
                />

                <Separator />

                <ConsentSection
                  photoRelease={child.photoRelease}
                  isEditing={isEditing}
                  onUpdate={(photoRelease) => {
                    setChildren((prev) => prev.map((c) => (c.localId === child.localId ? { ...c, photoRelease } : c)));
                  }}
                />

                <Separator />

                <MedicalInfoSection
                  data={child.medicalInfo}
                  isEditing={isEditing}
                  onUpdate={(updated) => {
                    setChildren((prev) =>
                      prev.map((c) => (c.localId === child.localId ? { ...c, medicalInfo: updated } : c)),
                    );
                  }}
                />
              </div>
            ),
        )}
      </div>

      <AddFamilyMemberDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSubmit={handleAddFamilyMember}
      />
    </div>
  );
}
