import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const isOnboardingRoute = createRouteMatcher(["/onboarding", "/onboarding/children"]);
const isPublicRoute = createRouteMatcher(["/", "/api/webhooks/clerk"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId, sessionClaims, redirectToSignIn } = await auth();
  const role = sessionClaims?.metadata?.userRole;

  // For users visiting /onboarding, don't try to redirect
  if (userId && isOnboardingRoute(req)) {
    return NextResponse.next();
  }

  // If the user isn't signed in and the route is private, redirect to sign-in
  if (!userId && !isPublicRoute(req)) return redirectToSignIn({ returnBackUrl: req.url });

  // Catch users who do not have `onboardingComplete: true` in their publicMetadata
  // Redirect them to the /onboading route to complete onboarding
  if (userId && !sessionClaims?.metadata?.onboardingComplete && !isPublicRoute(req)) {
    const onboardingUrl = new URL("/onboarding", req.url);
    return NextResponse.redirect(onboardingUrl);
  }

  // Restrict access to `/admin` pages
  if (isAdminRoute(req)) {
    if (!userId || role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url)); // Redirect non-admins to homepage
    }
  }

  // If the user is logged in and the route is protected, let them view.
  if (userId && !isPublicRoute(req)) return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
