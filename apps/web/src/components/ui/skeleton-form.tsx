import { Skeleton } from "./skeleton";

interface SkeletonFormFieldProps {
  className?: string;
  showLabel?: boolean;
  showInput?: boolean;
  inputWidth?: string;
}

export function SkeletonFormField({ 
  className, 
  showLabel = true, 
  showInput = true,
  inputWidth = "w-full"
}: SkeletonFormFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel && <Skeleton className="h-4 w-24" />}
      {showInput && <Skeleton className={`h-10 ${inputWidth}`} />}
    </div>
  );
}

interface SkeletonFormProps {
  className?: string;
  fields?: number;
  showActions?: boolean;
}

export function SkeletonForm({ 
  className, 
  fields = 4,
  showActions = true
}: SkeletonFormProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: fields }).map((_, i) => (
        <SkeletonFormField key={i} />
      ))}
      
      {showActions && (
        <div className="flex justify-end gap-2 pt-4">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
        </div>
      )}
    </div>
  );
}