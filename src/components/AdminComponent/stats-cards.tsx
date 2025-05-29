import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, Baby, Heart } from "lucide-react";
import type { UserStats } from "@/app/actions/users/action";

interface StatsCardsProps {
  stats: UserStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      description: "Regular users",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Administrators",
      value: stats.totalAdmins,
      description: "Admin users",
      icon: Shield,
      color: "text-green-600",
    },
    {
      title: "Children",
      value: stats.totalChildren,
      description: "Registered children",
      icon: Baby,
      color: "text-purple-600",
    },
    {
      title: "Donators",
      value: stats.totalDonators,
      description: "Donator users",
      icon: Heart,
      color: "text-red-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
