import { Skeleton } from "./skeleton";
import { Card, CardContent, CardHeader } from "./card";

interface SkeletonCardProps {
  className?: string;
  showHeader?: boolean;
  showContent?: boolean;
  contentLines?: number;
  headerHeight?: string;
  contentHeight?: string;
}

export function SkeletonCard({ 
  className, 
  showHeader = true, 
  showContent = true,
  contentLines = 3,
  headerHeight = "h-4",
  contentHeight = "h-4"
}: SkeletonCardProps) {
  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <div className="space-y-2">
            <Skeleton className={`w-1/3 ${headerHeight}`} />
            <Skeleton className={`w-1/2 h-3`} />
          </div>
        </CardHeader>
      )}
      {showContent && (
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: contentLines }).map((_, i) => (
              <Skeleton 
                key={i} 
                className={`${contentHeight} ${i === contentLines - 1 ? 'w-3/4' : 'w-full'}`} 
              />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}