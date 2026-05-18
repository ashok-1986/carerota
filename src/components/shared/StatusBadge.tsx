import { Badge } from "@/components/ui/badge";

const statusVariantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  success: "default",
  active: "default",
  error: "destructive",
  failed: "destructive",
  warning: "secondary",
  pending: "secondary",
};

export function StatusBadge({ status }: { status: string }) {
  const variant = statusVariantMap[status.toLowerCase()] || "default";
  return <Badge variant={variant}>{status}</Badge>;
}
