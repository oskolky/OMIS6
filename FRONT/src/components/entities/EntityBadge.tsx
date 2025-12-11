import { cn } from "@/lib/utils";

interface EntityBadgeProps {
  type: "person" | "organization" | "location" | "date" | "other";
  children: React.ReactNode;
  className?: string;
}

const EntityBadge = ({ type, children, className }: EntityBadgeProps) => {
  const getTypeStyles = () => {
    switch (type) {
      case "person":
        return "border-l-4 border-l-accent";
      case "organization":
        return "border-l-4 border-l-primary";
      case "location":
        return "border-l-4 border-l-warning";
      case "date":
        return "border-l-4 border-l-muted-foreground";
      default:
        return "border-l-4 border-l-border";
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 bg-secondary font-mono text-sm",
        getTypeStyles(),
        className
      )}
    >
      {children}
    </span>
  );
};

export default EntityBadge;
