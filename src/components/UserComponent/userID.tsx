"use client";

import { useUser } from "@clerk/nextjs";

const UserClerkID = () => {
  const { user } = useUser(); // Get authenticated user
  const clerkID = user?.id; // Extract Clerk user ID

  return (
    <div>
      <h2>Clerk User ID</h2>
      <p>{clerkID ? `Your Clerk ID: ${clerkID}` : "Not logged in"}</p>
    </div>
  );
};

export default UserClerkID;
