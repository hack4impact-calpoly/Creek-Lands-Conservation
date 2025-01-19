import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-gray-100 to-blue-300">
      <h1 className="text-3xl font-semibold mb-6 text-gray-900">
        Welcome to the Homepage!
      </h1>
      <Link
        href="/Eman-Gon"
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded shadow-lg transform transition duration-300 hover:scale-105"
      >
        Visit Eman Gonzalez&apos;s Page
      </Link>
    </main>
  );
}
