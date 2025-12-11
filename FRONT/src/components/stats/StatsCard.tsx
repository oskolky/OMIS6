import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
}

const StatsCard = ({ title, value, subtitle, icon: Icon }: StatsCardProps) => {
  return (
    <div className="border border-border p-6 bg-card hover:bg-secondary/30 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 bg-secondary">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      <div>
        <p className="font-mono text-3xl font-bold tracking-tight">{value}</p>
        <p className="font-mono text-sm text-muted-foreground mt-1">{title}</p>
        {subtitle && (
          <p className="font-mono text-xs text-muted-foreground mt-2">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
