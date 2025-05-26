import { Badge } from "@/components/ui/badge";
import { Shield, User, Heart } from "lucide-react";

interface RoleBadgeProps {
  role: "user" | "admin" | "donator";
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const roleConfig = {
    user: {
      label: "User",
      variant: "secondary" as const,
      icon: User,
      className: "text-blue-700 bg-blue-100 hover:bg-blue-200",
    },
    admin: {
      label: "Admin",
      variant: "default" as const,
      icon: Shield,
      className: "text-green-700 bg-green-100 hover:bg-green-200",
    },
    donator: {
      label: "Donator",
      variant: "outline" as const,
      icon: Heart,
      className: "text-red-700 bg-red-100 hover:bg-red-200",
    },
  };

  const config = roleConfig[role];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={config.className}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  );
}
