import { Skeleton } from "./skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./card";

interface SkeletonChartProps {
  className?: string;
  height?: string;
  showHeader?: boolean;
  title?: string;
  description?: string;
  showLegend?: boolean;
}

export function SkeletonChart({ 
  className, 
  height = "h-[200px]",
  showHeader = true,
  title,
  description,
  showLegend = true
}: SkeletonChartProps) {
  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <Skeleton className={`w-full ${height}`} />
        {showLegend && (
          <div className="flex items-center justify-center gap-4 pt-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}