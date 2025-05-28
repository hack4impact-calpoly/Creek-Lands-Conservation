import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserTable } from "@/components/AdminComponent/user-table";
import { StatsCards } from "@/components/AdminComponent/stats-cards";
import { getUsers, getUserStats } from "@/app/actions/users/action";

export default async function AdminPage() {
  return (
    <div className="container mx-auto space-y-8 px-4 py-8">
      <div className="mb-8 flex flex-col">
        <h1 className="mb-2 text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users, view statistics, and control access permissions.</p>
      </div>

      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCardsWrapper />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View all users and manage their roles and permissions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<UserTableSkeleton />}>
            <UserTableWrapper />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

async function StatsCardsWrapper() {
  const stats = await getUserStats();
  return <StatsCards stats={stats} />;
}

async function UserTableWrapper() {
  const users = await getUsers();
  return <UserTable users={users} />;
}

function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="mb-2 h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function UserTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="rounded-lg border">
        <div className="border-b p-4">
          <div className="flex space-x-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-20" />
            ))}
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-b p-4 last:border-b-0">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
