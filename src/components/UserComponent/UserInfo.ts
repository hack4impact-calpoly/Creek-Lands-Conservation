export type Gender = "" | "Male" | "Female" | "Non-binary" | "Prefer not to say";

export interface Child {
  localId: number;
  _id?: string;
  firstName: string;
  lastName: string;
  birthday: string; // YYYY-MM-DD format
  gender: "Male" | "Female" | "Non-binary" | "Prefer not to say" | "";
  medicalInfo: MedicalInfo;
  emergencyContacts: EmergencyContact[];
}

export type NewChild = {
  firstName: string;
  lastName: string;
  birthday: string;
  gender: "" | "Male" | "Female" | "Non-binary" | "Prefer not to say";
};

export interface Guardian {
  name: string;
  relationship: string;
  phone: string;
  work: string;
  email: string;
  canPickup: boolean;
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
