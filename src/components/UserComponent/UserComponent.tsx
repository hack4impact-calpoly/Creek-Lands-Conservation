"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import styles from "./UserComponent.module.css";

// Define the shape of the child object in the frontend
interface Child {
  // "localId" is just for React state tracking (not stored in DB).
  localId: number;
  childID?: string; // optional if new children haven't been assigned an ID by MongoDB
  firstName: string;
  lastName: string;
  birthday: string; // store as YYYY-MM-DD in the UI
  gender: string;
}

let localChildCounter = 0;

export default function PersonalInfo() {
  const { isLoaded, user } = useUser();

  // Loading & error states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Personal info data
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [birthday, setBirthday] = useState("");
  const [children, setChildren] = useState<Child[]>([]);

  // Editing mode
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isLoaded || !user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // GET from /api/users/[clerkID]
        const response = await fetch(`/api/users/${user.id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.status}`);
        }

        const userData = await response.json();
        console.log("MongoDB User Data:", userData);

        if (!userData || !userData._id) {
          console.warn("User not found in MongoDB");
          setError("User not found in MongoDB.");
          setLoading(false);
          return;
        }

        // Populate parent's info
        setFirstName(userData.firstName || "");
        setLastName(userData.lastName || "");
        setEmail(userData.email || "");
        setGender(userData.gender || "");
        setBirthday(userData.birthday ? new Date(userData.birthday).toISOString().split("T")[0] : "");

        // Map DB children into local state
        const mappedChildren: Child[] =
          userData.children?.map((childData: any) => {
            localChildCounter += 1;
            return {
              localId: localChildCounter,
              childID: childData.childID ?? "",
              firstName: childData.firstName ?? "",
              lastName: childData.lastName ?? "",
              birthday: childData.birthday ? new Date(childData.birthday).toISOString().split("T")[0] : "",
              gender: childData.gender ?? "",
            };
          }) || [];

        setChildren(mappedChildren);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load user data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isLoaded, user]);

  // -----------------------
  // Handlers
  // -----------------------
  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleAddChild = () => {
    localChildCounter += 1;
    setChildren((prev) => [
      ...prev,
      {
        localId: localChildCounter,
        childID: "",
        firstName: "",
        lastName: "",
        birthday: "",
        gender: "",
      },
    ]);
  };

  const handleEditChild = (localId: number, field: keyof Child, value: string) => {
    setChildren((prev) => prev.map((child) => (child.localId === localId ? { ...child, [field]: value } : child)));
  };

  const handleDeleteChild = (localId: number) => {
    setChildren((prev) => prev.filter((child) => child.localId !== localId));
  };

  const validateFields = () => {
    // Ensure parent fields are filled
    const requiredParentFields = [firstName, lastName, email, gender, birthday];
    const parentIsValid = requiredParentFields.every((field) => field.trim().length > 0);
    if (!parentIsValid) {
      alert("Please fill out all fields for the parent's information.");
      return false;
    }

    // Ensure each child is filled
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (!child.firstName.trim() || !child.lastName.trim() || !child.birthday.trim() || !child.gender.trim()) {
        alert(`Please fill out all required fields for child #${i + 1} (first/last name, birthday, gender).`);
        return false;
      }
    }

    return true;
  };

  const handleSaveChanges = async () => {
    if (!validateFields()) {
      return;
    }

    try {
      // Prepare data for PUT
      const payload = {
        clerkID: user?.id,
        firstName,
        lastName,
        email,
        gender,
        birthday: birthday ? new Date(birthday).toISOString() : "",
        children: children.map((child) => ({
          // If you want to preserve childID from DB
          firstName: child.firstName,
          lastName: child.lastName,
          birthday: child.birthday ? new Date(child.birthday).toISOString() : null,
          gender: child.gender,
        })),
      };

      const response = await fetch(`/api/users/${user?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to update user data: ${response.status}`);
      }

      const updatedUser = await response.json();
      console.log("User updated successfully:", updatedUser);

      // Optionally re-map updated children from DB if desired
      // For now, let's just exit edit mode
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating user data:", err);
      setError("Failed to update user data. Please try again later.");
    }
  };

  // -----------------------
  // Render UI
  // -----------------------
  if (loading) return <p>Loading user data...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className={styles.personalInfoContainer}>
      <h2 className={styles.header}>Personal Information</h2>

      <div className={styles.formGroup}>
        <label>
          First Name:
          <input
            className={styles.inputField}
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={!isEditing}
          />
        </label>
        <label>
          Last Name:
          <input
            className={styles.inputField}
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={!isEditing}
          />
        </label>
        <label>
          Email:
          <input
            className={styles.inputField}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!isEditing}
          />
        </label>
        <label>
          Gender:
          {!isEditing ? (
            <input className={styles.inputField} type="text" value={gender} disabled />
          ) : (
            <select className={styles.inputField} value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          )}
        </label>
        <label>
          Birthday:
          <input
            className={styles.inputField}
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            disabled={!isEditing}
          />
        </label>
      </div>

      <h3 className={styles.header}>Children</h3>
      {children.map((child) => (
        <div key={child.localId} className={styles.childEntry}>
          {/* If needed for debugging: 
            {child.childID && <p>Child ID: {child.childID}</p>} 
          */}
          <label>
            First Name:
            <input
              className={styles.inputField}
              type="text"
              placeholder="Child's first name"
              value={child.firstName}
              onChange={(e) => handleEditChild(child.localId, "firstName", e.target.value)}
              disabled={!isEditing}
            />
          </label>
          <label>
            Last Name:
            <input
              className={styles.inputField}
              type="text"
              placeholder="Child's last name"
              value={child.lastName}
              onChange={(e) => handleEditChild(child.localId, "lastName", e.target.value)}
              disabled={!isEditing}
            />
          </label>
          <label>
            Birthday:
            <input
              className={styles.inputField}
              type="date"
              value={child.birthday}
              onChange={(e) => handleEditChild(child.localId, "birthday", e.target.value)}
              disabled={!isEditing}
            />
          </label>
          <label>
            Gender:
            {!isEditing ? (
              <input className={styles.inputField} type="text" value={child.gender} disabled />
            ) : (
              <select
                className={styles.inputField}
                value={child.gender}
                onChange={(e) => handleEditChild(child.localId, "gender", e.target.value)}
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            )}
          </label>

          {isEditing && (
            <button className={`${styles.button} ${styles.deleteBtn}`} onClick={() => handleDeleteChild(child.localId)}>
              Delete
            </button>
          )}
        </div>
      ))}

      {isEditing && (
        <button className={styles.button} onClick={handleAddChild}>
          Add Child
        </button>
      )}

      {!isEditing ? (
        <button className={styles.button} onClick={handleEditClick}>
          Edit Info
        </button>
      ) : (
        <button className={styles.button} onClick={handleSaveChanges}>
          Save Changes
        </button>
      )}
    </div>
  );
}
