export interface IUserData {
  _id: string;
  clerkID: string;
  userRole: "user" | "admin" | "donator";
  firstName: string;
  lastName: string;
  email: string;
  gender: "Male" | "Female" | "Non-binary" | "Prefer Not to Say" | "";
  birthday?: string | null; // ISO string or null
  address?: {
    home?: string;
    city?: string;
    zipCode?: string;
  };
  phoneNumbers?: {
    cell?: string;
    work?: string;
  };
  imageUrl?: string;
  imageKey?: string;
  children: IChildData[];
  registeredEvents: string[]; // ObjectIds as strings
  waiversSigned: string[]; // ObjectIds as strings
}

export interface IChildData {
  _id: string;
  firstName: string;
  lastName: string;
  birthday?: string; // ISO string from Date
  gender: "Male" | "Female" | "Non-binary" | "Prefer Not to Say" | "";
  imageUrl?: string;
  imageKey?: string;
  registeredEvents: string[]; // ObjectIds as strings
  waiversSigned: string[]; // ObjectIds as strings
}
