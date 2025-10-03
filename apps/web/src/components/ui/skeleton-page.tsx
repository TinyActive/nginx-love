import { SkeletonSidebar } from "./skeleton-sidebar";
import { SkeletonStatsCard } from "./skeleton-stats-card";
import { SkeletonChart } from "./skeleton-chart";
import { SkeletonTable } from "./skeleton-table";
import { Skeleton } from "./skeleton";
import { SidebarProvider, SidebarInset } from "./sidebar";

interface SkeletonPageProps {
  type?: "dashboard" | "table" | "form" | "chart";
  showSidebar?: boolean;
  className?: string;
}

export function SkeletonPage({ 
  type = "dashboard", 
  showSidebar = true,
  className 
}: SkeletonPageProps) {
  const renderContent = () => {
    switch (type) {
      case "dashboard":
        return (
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>

            {/* Alert Card */}
            <div className="border border-destructive/20 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-4 w-64 mt-2" />
            </div>

            {/* Stats Cards Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonStatsCard key={i} />
              ))}
            </div>

            {/* Charts Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              <SkeletonChart title="CPU Usage" description="Last 24 hours" />
              <SkeletonChart title="Memory Usage" description="Last 24 hours" />
            </div>

            {/* Recent Alerts Table */}
            <SkeletonTable rows={5} columns={3} title="Recent Alerts" />
          </div>
        );

      case "table":
        return (
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonStatsCard key={i} />
              ))}
            </div>

            {/* Search Bar */}
            <div className="flex items-center space-x-2">
              <Skeleton className="h-10 w-64" />
            </div>

            {/* Main Table */}
            <SkeletonTable rows={8} columns={6} showCard={false} />
          </div>
        );

      case "form":
        return (
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>

            {/* Form Content */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
                <div className="flex justify-end gap-2 pt-4">
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            </div>
          </div>
        );

      case "chart":
        return (
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonStatsCard key={i} />
              ))}
            </div>

            {/* Main Chart */}
            <SkeletonChart 
              title="Performance Timeline" 
              description="Detailed performance metrics over time" 
              height="h-[400px]" 
            />

            {/* Secondary Charts */}
            <div className="grid gap-4 md:grid-cols-2">
              <SkeletonChart title="Slow Requests" description="Requests with response time > 200ms" />
              <SkeletonChart title="High Error Rate Periods" description="Time periods with error rate > 3%" />
            </div>
          </div>
        );

      default:
        return <Skeleton className="h-96 w-full" />;
    }
  };

  if (showSidebar) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <SkeletonSidebar collapsed={false} />
        <SidebarInset>
          <div className="p-6">
            {renderContent()}
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      {renderContent()}
    </div>
  );
}