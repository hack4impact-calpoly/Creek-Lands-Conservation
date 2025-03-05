"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";

const Navbar = () => {
  const pathname = usePathname();

  return (
    <nav className="w-full border-b border-gray-300 bg-white">
      {/* Top Section: Logo */}
      <div className="flex items-center px-4 py-2">
        <Link href="/">
          <Image src="/logoCreekLandsConservation.png" alt="Creek Lands Logo" width={150} height={50} />
        </Link>
      </div>

      {/* Bottom Section: Navigation Bar */}
      <div className="flex w-full items-center border-t border-gray-400 bg-white">
        {/* Left-aligned Navigation Links */}
        <div className="flex space-x-0">
          <Link
            href="/"
            className={`px-6 py-2 text-center font-bold ${
              pathname === "/" ? "bg-gray-500 text-white" : "hover:bg-gray-300"
            }`}
          >
            Events
          </Link>
          <Link
            href="/waivers"
            className={`px-6 py-2 text-center font-bold ${
              pathname === "/waivers" ? "bg-gray-500 text-white" : "hover:bg-gray-300"
            }`}
          >
            Waivers
          </Link>
        </div>

        {/* Spacer to push My Profile to the right */}
        <div className="flex-grow"></div>

        {/* Right-aligned My Profile */}
        <div className="flex items-center space-x-2">
          <Link
            href="/user"
            className={`px-6 py-2 text-center font-bold ${
              pathname === "/user" ? "bg-gray-500 text-white" : "hover:bg-gray-300"
            }`}
          >
            My Profile
          </Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
