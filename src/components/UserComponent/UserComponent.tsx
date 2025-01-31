"use client";

import { useState, useEffect } from "react";
import styles from "./UserComponent.module.css";

interface Child {
  id: number;
  name: string;
  birthday: string;
  gender: string;
}

//needed to object identify each child
let childIdCounter = 0;

const PersonalInfo = ({ userId }: { userId: string }) => {
  //personal info data
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [birthday, setBirthday] = useState("");
  const [children, setChildren] = useState<Child[]>([]);

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }
        const userData = await response.json();

        setFirstName(userData.firstName || "");
        setLastName(userData.lastName || "");
        setEmail(userData.email || "");
        setGender(userData.gender || "");
        setBirthday(userData.birthday ? new Date(userData.birthday).toISOString().split("T")[0] : "");

        setChildren(
          userData.children?.map((child: Child) => ({
            id: ++childIdCounter,
            name: child.name || "",
            birthday: child.birthday ? new Date(child.birthday).toISOString().split("T")[0] : "",
            gender: child.gender || "",
          })) || [],
        );
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const handleAddChild = () => {
    childIdCounter += 1;
    setChildren((prevChildren) => [...prevChildren, { id: childIdCounter, name: "", birthday: "", gender: "" }]);
  };

  const handleEditChild = (id: number, field: keyof Child, value: string) => {
    setChildren((prevChildren) =>
      prevChildren.map((child) => (child.id === id ? { ...child, [field]: value } : child)),
    );
  };

  const handleDeleteChild = (id: number) => {
    setChildren((prevChildren) => prevChildren.filter((child) => child.id !== id));
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  /**
   * Validate fields. If any required field is empty, alert the user and stop.
   */
  const validateFields = () => {
    // Trim to ensure we don't treat whitespace as valid input.
    const requiredParentFields = [firstName, lastName, email, gender, birthday];
    // Check if any parent field is empty.
    const parentIsValid = requiredParentFields.every((field) => field.trim().length > 0);
    if (!parentIsValid) {
      alert("Please fill out all fields for the parent's information.");
      return false;
    }

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (!child.name.trim() || !child.birthday.trim() || !child.gender.trim()) {
        alert(`Please fill out all fields for child #${i + 1} (Name, Birthday, Gender).`);
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
      const payload = {
        firstName,
        lastName,
        email,
        gender,
        // Convert date string to ISO
        birthday: birthday ? new Date(birthday).toISOString() : "",
        children: children.map((child) => ({
          name: child.name,
          birthday: child.birthday ? new Date(child.birthday).toISOString() : "",
          gender: child.gender,
        })),
      };
      //put request
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to update user data");
      }

      const updatedUser = await response.json();
      console.log("User updated successfully:", updatedUser);
      setIsEditing(false);
    } catch (error) {
      console.error(error);
    }
  };

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
        <div key={child.id} className={styles.childEntry}>
          <input
            className={styles.inputField}
            type="text"
            placeholder="Enter child’s name"
            value={child.name}
            onChange={(e) => handleEditChild(child.id, "name", e.target.value)}
            disabled={!isEditing}
          />
          <input
            className={styles.inputField}
            type="date"
            value={child.birthday}
            onChange={(e) => handleEditChild(child.id, "birthday", e.target.value)}
            disabled={!isEditing}
          />

          {!isEditing ? (
            <input className={styles.inputField} type="text" value={child.gender} disabled />
          ) : (
            <select
              className={styles.inputField}
              value={child.gender}
              onChange={(e) => handleEditChild(child.id, "gender", e.target.value)}
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          )}

          {isEditing && (
            <button className={`${styles.button} ${styles.deleteBtn}`} onClick={() => handleDeleteChild(child.id)}>
              Delete
            </button>
          )}
        </div>
      ))}

      {isEditing && (
        <button className={`${styles.button} ${styles.addChildBtn}`} onClick={handleAddChild}>
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
};

export default PersonalInfo;
