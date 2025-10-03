import { Skeleton } from "./skeleton";
import { Card, CardContent, CardHeader } from "./card";

interface SkeletonStatsCardProps {
  className?: string;
  showIcon?: boolean;
}

export function SkeletonStatsCard({ className, showIcon = true }: SkeletonStatsCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        {showIcon && <Skeleton className="h-4 w-4" />}
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}