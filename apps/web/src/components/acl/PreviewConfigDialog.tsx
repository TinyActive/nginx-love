import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, FileCode, Copy, CheckCircle } from "lucide-react";
import { usePreviewAclConfig } from "@/queries";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface PreviewConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PreviewConfigDialog({ open, onOpenChange }: PreviewConfigDialogProps) {
  const { toast } = useToast();
  const { data, isLoading, error } = usePreviewAclConfig();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (data?.config) {
      navigator.clipboard.writeText(data.config);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Configuration copied to clipboard"
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            Preview Nginx ACL Configuration
          </DialogTitle>
          <DialogDescription>
            Review the generated nginx configuration before applying
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to load configuration preview. Please try again.
              </AlertDescription>
            </Alert>
          )}

          {data && (
            <>
              <Alert>
                <AlertDescription>
                  <strong>{data.rulesCount}</strong> enabled rule{data.rulesCount !== 1 ? 's' : ''} will be applied to nginx configuration
                </AlertDescription>
              </Alert>

              <div className="relative">
                <div className="absolute right-2 top-2 z-10">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleCopy}
                    className="gap-2"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[50vh] text-sm">
                  <code>{data.config}</code>
                </pre>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
