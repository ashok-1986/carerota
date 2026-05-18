"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer } from "@/lib/animations";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { LeaveRequestCard } from "./LeaveRequestCard";
import { useLeaveRequests } from "@/hooks/useLeave";
import { RefreshCw } from "lucide-react";

type LeaveRequestListProps = {
  onApprove?: (id: string) => void;
  onDecline?: (id: string) => void;
  isManager: boolean;
};

const tabs = ["pending", "approved", "declined", "all"] as const;

function countByStatus(data: { status: string }[], status: string) {
  if (status === "all") return data.length;
  return data.filter((r) => r.status === status).length;
}

function SkeletonCard() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate/10 bg-white p-4 shadow-sm">
      <Skeleton className="size-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-8 w-20 shrink-0" />
    </div>
  );
}

export function LeaveRequestList({ onApprove, onDecline, isManager }: LeaveRequestListProps) {
  const [activeTab, setActiveTab] = useState("pending");
  const { data: requests = [], isLoading, isError, refetch } = useLeaveRequests();

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)}>
      <TabsList className="mb-4">
        {tabs.map((tab) => {
          const count = countByStatus(requests, tab);
          return (
            <TabsTrigger key={tab} value={tab} className="relative capitalize">
              {tab}
              <Badge
                variant="outline"
                className={`ml-1.5 text-[10px] px-1.5 py-0 ${
                  tab === "pending" && count > 0
                    ? "bg-gold/10 text-gold border-gold/20"
                    : "bg-slate/10 text-slate border-slate/20"
                }`}
              >
                {count}
              </Badge>
            </TabsTrigger>
          );
        })}
      </TabsList>

      {isLoading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <EmptyState title="Failed to load" description="Could not load leave requests" />
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="size-4 mr-1" />
            Retry
          </Button>
        </div>
      ) : (
        tabs.map((tab) => {
          const items = tab === "all" ? requests : requests.filter((r) => r.status === tab);
          return (
            <TabsContent key={tab} value={tab}>
              {items.length === 0 ? (
                <EmptyState
                  title={
                    tab === "pending"
                      ? "No pending requests"
                      : tab === "approved"
                        ? "No approved leave this period"
                        : tab === "declined"
                          ? "No declined requests"
                          : "No leave requests found"
                  }
                  description={
                    tab === "pending"
                      ? "All clear — no requests awaiting review"
                      : "There are no requests in this category"
                  }
                />
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-3"
                >
                  {items.map((request) => (
                    <LeaveRequestCard
                      key={request.id}
                      request={request}
                      onApprove={onApprove}
                      onDecline={onDecline}
                      isManager={isManager}
                    />
                  ))}
                </motion.div>
              )}
            </TabsContent>
          );
        })
      )}
    </Tabs>
  );
}
