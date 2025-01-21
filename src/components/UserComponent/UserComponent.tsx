"use client";

import { useState } from "react";
import styles from "./UserComponent.module.css";

interface Child {
  id: number;
  name: string;
  birthday: string;
  gender: string;
}

const PersonalInfo = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [birthday, setBirthday] = useState("");
  const [children, setChildren] = useState<Child[]>([]);

  const handleAddChild = () => {
    setChildren([...children, { id: Date.now(), name: "", birthday: "", gender: "" }]);
  };

  const handleEditChild = (id: number, field: keyof Child, value: string) => {
    setChildren(children.map((child) => (child.id === id ? { ...child, [field]: value } : child)));
  };

  const handleDeleteChild = (id: number) => {
    setChildren(children.filter((child) => child.id !== id));
  };

  const handleSaveChanges = () => {
    setFirstName(firstName);
    setLastName(lastName);
    setEmail(email);
    setGender(gender);
    setBirthday(birthday);
    setChildren([...children]);
    console.log("Saved:", { firstName, lastName, email, gender, birthday, children });
  };

  return (
    <div className={styles.personalInfoContainer}>
      <h2 className={styles.header}>Personal Information</h2>
      <div className={styles.formGroup}>
        <label>
          First Name:{" "}
          <input
            className={styles.inputField}
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </label>
        <label>
          Last Name:{" "}
          <input
            className={styles.inputField}
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </label>
        <label>
          Email:{" "}
          <input className={styles.inputField} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Gender:
          <select className={styles.inputField} value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Non-binary">Non-binary</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </label>
        <label>
          Birthday:{" "}
          <input
            className={styles.inputField}
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
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
          />
          <input
            className={styles.inputField}
            type="date"
            value={child.birthday}
            onChange={(e) => handleEditChild(child.id, "birthday", e.target.value)}
          />
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
          <button className={`${styles.button} ${styles.deleteBtn}`} onClick={() => handleDeleteChild(child.id)}>
            Delete
          </button>
        </div>
      ))}
      <button className={`${styles.button} ${styles.addChildBtn}`} onClick={handleAddChild}>
        Add Child
      </button>
      <button className={styles.saveButton} onClick={handleSaveChanges}>
        Save Changes
      </button>
    </div>
  );
};

export default PersonalInfo;
