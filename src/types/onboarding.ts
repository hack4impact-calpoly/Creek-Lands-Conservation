export type OnboardingFormData = {
  firstName: string;
  lastName: string;
  email: string;
  gender: "Male" | "Female" | "Non-binary" | "Prefer Not to Say" | "";
  birthday: string;
  homeAddress: string;
  city: string;
  zipCode: string;
  cellphone: string;
  workphone?: string;
};

export type ChildFormData = {
  children: Array<{
    firstName: string;
    lastName: string;
    birthday: string;
    gender: "Male" | "Female" | "Non-binary" | "Prefer Not to Say" | "";
  }>;
};
