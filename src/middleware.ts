import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const isOnboardingRoute = createRouteMatcher(["/onboarding", "/onboarding/children"]);
const isApiRoute = createRouteMatcher(["/api(.*)"]);
const isPublicRoute = createRouteMatcher(["/", "/api/webhooks/clerk"]);
const isProtectedRoute = createRouteMatcher(["/waivers", "/user"]); // Fixed: /users not /user
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId, sessionClaims, redirectToSignIn } = await auth();
  const role = sessionClaims?.metadata?.userRole;

  // Don't require onboarding for API calls and onboarding routes, but still need auth for APIs
  if (userId && (isOnboardingRoute(req) || isApiRoute(req))) {
    return NextResponse.next();
  }

  // If user not signed in and trying to access protected/admin routes, redirect to sign-in
  if (!userId && (isProtectedRoute(req) || isAdminRoute(req))) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  // Allow public routes for everyone
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // If user is signed in but hasn't completed onboarding, redirect to onboarding
  if (userId && !sessionClaims?.metadata?.onboardingComplete && (isProtectedRoute(req) || isAdminRoute(req))) {
    const onboardingUrl = new URL("/onboarding", req.url);
    return NextResponse.redirect(onboardingUrl);
  }

  // Admin route access control
  if (isAdminRoute(req)) {
    if (!userId || role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Allow access to protected routes for authenticated users with completed onboarding
  if (userId && isProtectedRoute(req) && sessionClaims?.metadata?.onboardingComplete) {
    return NextResponse.next();
  }

  // Default: allow access
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
