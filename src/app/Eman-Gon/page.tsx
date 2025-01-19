"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function EmanGonPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-500 to-gray-100 text-gray-900">
      <h1 className="text-5xl font-extrabold text-center mb-4">
        Hello
      </h1>
      <p className="text-lg text-center max-w-md mb-6">
        Welcome
      </p>
      <button
        onClick={() => router.back()}
        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
      >
        Go Back
      </button>
    </main>
  );
}
