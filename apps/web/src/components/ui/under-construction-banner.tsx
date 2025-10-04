import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export const UnderConstructionBanner = () => {
  return (
    <Alert className="mb-6 bg-primary/10 border-primary/20 text-primary dark:bg-primary/5 dark:border-primary/15">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        This page is currently under construction. Some features may not be fully functional.
      </AlertDescription>
    </Alert>
  );
};