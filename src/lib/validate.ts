function isEmergencyContactComplete(contact: EmergencyContact): boolean {
  return !!(contact.name && contact.phone && contact.relationship);
}

function hasCompleteEmergencyContact(contacts: EmergencyContact[]): boolean {
  return Array.isArray(contacts) && contacts.some(isEmergencyContactComplete);
}

function isAddressComplete(address?: IUser["address"]): boolean {
  return !!(address?.home && address.city && address.zipCode);
}

function isMedicalInfoComplete(medicalInfo: MedicalInfo): boolean {
  return medicalInfo?.photoRelease !== undefined;
}

export function isUserProfileComplete(user: IUser): boolean {
  return (
    !!user.firstName &&
    !!user.lastName &&
    !!user.email &&
    !!user.gender &&
    !!user.birthday &&
    isAddressComplete(user.address) &&
    isMedicalInfoComplete(user.medicalInfo) &&
    hasCompleteEmergencyContact(user.emergencyContacts)
  );
}

export function isChildProfileComplete(child: IChild): boolean {
  return (
    !!child.firstName &&
    !!child.lastName &&
    !!child.gender &&
    !!child.birthday &&
    isMedicalInfoComplete(child.medicalInfo) &&
    hasCompleteEmergencyContact(child.emergencyContacts)
  );
}
