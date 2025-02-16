import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function authenticateAdmin(req: Request) {
  const { userId, sessionClaims } = await auth();
  const role = sessionClaims?.metadata?.userRole;

  if (!userId || role !== "admin") {
    return NextResponse.json({ message: "Access denied. Admins only." }, { status: 403 });
  }

  return true;
}
