"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { User, Menu, ChevronRight, X } from "lucide-react";

const Navbar = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();

  // Check if user is admin from Clerk's metadata
  const isAdmin = user?.publicMetadata?.userRole === "admin";

  // Dynamic routes based on user role
  const eventsHref = isAdmin ? "/admin/events" : "/";
  const usersHref = isAdmin ? "/admin/users" : "/user";

  // Navigation items - add Users link for admins
  const navItems = [
    { label: "Events", href: eventsHref },
    { label: "Waivers", href: "/waivers" },
    ...(isAdmin ? [{ label: "Users", href: "/admin/users" }] : []),
  ];

  const mobileNavItems = [
    { label: "Events", href: eventsHref },
    { label: "Waivers", href: "/waivers" },
    ...(isAdmin ? [{ label: "Users", href: "/admin/users" }] : []),
    { label: "Profile", href: "/user" },
  ];

  return (
    <nav className="w-full border-b-2 border-gray-400 bg-white shadow-md">
      <div className="flex h-20 w-full items-center bg-white px-4">
        {/* Left: Logo */}
        <div className="flex items-center">
          <Link href="/">
            <Image
              src="/creek_lands_conservation.png"
              alt="Creek Lands Logo"
              width={120}
              height={30}
              style={{ width: "auto", height: "auto" }}
              className="object-contain"
            />
          </Link>
        </div>

        {/* Centered Navigation Links (Desktop) */}
        <div className="hidden h-full flex-grow justify-center md:flex">
          <div className="flex h-full">
            {navItems.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={`relative flex h-full items-center px-8 text-xl font-semibold transition duration-200 ${
                  pathname === href
                    ? "text-primary underline decoration-4 underline-offset-8"
                    : "text-gray-700 hover:underline hover:decoration-4 hover:underline-offset-8"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right Section: Profile/Users, Menu & User Avatar */}
        <div className="ml-auto flex h-full items-center space-x-4">
          {/* Signed In: Show "My Profile" Link + User Avatar (Desktop) */}
          <SignedIn>
            <Link
              href="/user"
              className={`relative hidden h-full items-center px-6 text-xl font-semibold transition duration-200 md:flex ${
                pathname === "/user"
                  ? "text-primary underline decoration-4 underline-offset-8"
                  : "text-gray-700 hover:underline hover:decoration-4 hover:underline-offset-8"
              }`}
            >
              My Profile
            </Link>
            <UserButton />
          </SignedIn>

          {/* Signed Out: Show User Icon with My Profile Link (Desktop) */}
          <SignedOut>
            <SignInButton>
              <div className="ml-auto flex h-full items-center space-x-4">
                <Link
                  href="/user"
                  className={`relative hidden h-full items-center px-6 text-xl font-semibold transition duration-200 md:flex ${
                    pathname === "/user"
                      ? "text-primary underline decoration-4 underline-offset-8"
                      : "text-gray-700 hover:underline hover:decoration-4 hover:underline-offset-8"
                  }`}
                >
                  My Profile
                </Link>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-300 transition duration-200 hover:bg-gray-400">
                  <User className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </SignInButton>
          </SignedOut>

          {/* Mobile Menu Button (Always Visible on Right) */}
          <button
            className="flex h-12 w-12 items-center justify-center rounded-full transition duration-200 hover:bg-gray-400 md:hidden"
            onClick={() => setIsOpen(true)}
          >
            <Menu className="h-6 w-6 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Backdrop for Blur Effect */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-800 bg-opacity-50 backdrop-blur-none transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Dropdown Menu */}
      <div
        className={`shadow-3xl fixed right-0 top-0 z-50 h-screen w-64 border-l-2 bg-white transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Close Button */}
        <div className="flex justify-end p-3">
          <button
            className="rounded-full p-3 transition duration-200 hover:bg-gray-400"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-6 w-6 text-gray-700" />
          </button>
        </div>

        {/* Space Before Menu Items */}
        <div className="mt-10 flex flex-col space-y-6 px-6">
          {mobileNavItems.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="text-black-500 flex items-center justify-between text-2xl font-medium transition duration-200 hover:text-gray-500"
              onClick={() => setIsOpen(false)}
            >
              <span>{label}</span>
              <ChevronRight className="text-black-500 h-6 w-6 font-medium hover:text-gray-500" />
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
