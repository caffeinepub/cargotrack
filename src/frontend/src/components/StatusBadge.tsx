import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BookingStatus } from "../backend.d";

interface StatusBadgeProps {
  status: BookingStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  if (status === BookingStatus.approved) {
    return (
      <Badge
        className={cn(
          "bg-success/10 text-success border-success/30 hover:bg-success/20",
          className,
        )}
        variant="outline"
      >
        Approved
      </Badge>
    );
  }
  if (status === BookingStatus.rejected) {
    return (
      <Badge variant="destructive" className={className}>
        Rejected
      </Badge>
    );
  }
  return (
    <Badge
      className={cn(
        "bg-warning/10 text-warning border-warning/30 hover:bg-warning/20",
        className,
      )}
      variant="outline"
    >
      Pending
    </Badge>
  );
}
