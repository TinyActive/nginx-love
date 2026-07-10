import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileCode, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface BotPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: string;
  title?: string;
}

export function BotPreviewDialog({
  open,
  onOpenChange,
  config,
  title = 'Preview Nginx Configuration',
}: BotPreviewDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(config);
    setCopied(true);
    toast.success('Configuration copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-full max-w-[calc(100%-2rem)] flex-col gap-4 overflow-hidden sm:max-w-4xl">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 pr-8">
            <FileCode className="h-5 w-5 shrink-0" />
            {title}
          </DialogTitle>
          <DialogDescription>Review generated nginx Bot Manager configuration</DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
          <div className="flex shrink-0 justify-end">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <pre className="min-h-0 min-w-0 flex-1 overflow-auto rounded-lg bg-muted p-4 text-xs font-mono whitespace-pre-wrap break-all">
            {config || '# No configuration generated'}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}
