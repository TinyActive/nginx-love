import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogEntry } from "@/types";

interface LogDetailsDialogProps {
  log: LogEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogDetailsDialog({ log, open, onOpenChange }: LogDetailsDialogProps) {
  if (!log) return null;

  const getLevelColor = (
    level: string
  ): "destructive" | "default" | "secondary" | "outline" => {
    switch (level) {
      case "error":
        return "destructive";
      case "warning":
        return "outline";
      case "info":
        return "default";
      default:
        return "secondary";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "access":
        return "default";
      case "error":
        return "destructive";
      case "system":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-7xl max-h-[90vh] w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Log Details
            <Badge variant={getLevelColor(log.level)}>{log.level}</Badge>
            <Badge variant={getTypeColor(log.type)}>{log.type}</Badge>
          </DialogTitle>
          <DialogDescription>
            {new Date(log.timestamp).toLocaleString()}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] w-full rounded-md border p-4">
          <div className="space-y-4">
            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="font-medium">Source:</span> {log.source}
                </div>
                <div>
                  <span className="font-medium">Timestamp:</span>{" "}
                  {new Date(log.timestamp).toLocaleString()}
                </div>
                {log.domain && (
                  <div>
                    <span className="font-medium">Domain:</span>{" "}
                    <Badge variant="outline" className="font-mono">
                      {log.domain}
                    </Badge>
                  </div>
                )}
                {log.ip && (
                  <div>
                    <span className="font-medium">IP Address:</span> {log.ip}
                  </div>
                )}
              </div>
            </div>

            {/* Request Information */}
            {(log.method || log.path || log.uri || log.statusCode) && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Request Information</h3>
                <div className="space-y-3 text-sm">
                  {log.method && (
                    <div>
                      <span className="font-medium">Method:</span>{" "}
                      <Badge variant="outline">{log.method}</Badge>
                    </div>
                  )}
                  {log.path && (
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">Path:</span>
                      <div className="bg-muted px-3 py-2 rounded">
                        <code className="text-xs font-mono whitespace-pre-wrap break-all">
                          {log.path}
                        </code>
                      </div>
                    </div>
                  )}
                  {log.uri && (
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">URI:</span>
                      <div className="bg-muted px-3 py-2 rounded">
                        <code className="text-xs font-mono whitespace-pre-wrap break-all">
                          {log.uri}
                        </code>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {log.statusCode && (
                      <div>
                        <span className="font-medium">Status Code:</span>{" "}
                        <Badge
                          variant={
                            log.statusCode >= 500
                              ? "destructive"
                              : log.statusCode >= 400
                              ? "outline"
                              : "default"
                          }
                        >
                          {log.statusCode}
                        </Badge>
                      </div>
                    )}
                    {log.responseTime && (
                      <div>
                        <span className="font-medium">Response Time:</span>{" "}
                        {log.responseTime}ms
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ModSecurity Specific Information */}
            {(log.ruleId || log.severity || log.tags || log.file || log.uniqueId) && (
              <div>
                <h3 className="text-sm font-semibold mb-2">
                  ModSecurity WAF Details
                </h3>
                <div className="space-y-2 text-sm">
                  {log.ruleId && (
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[100px]">Rule ID:</span>
                      <Badge variant="destructive" className="font-mono">
                        {log.ruleId}
                      </Badge>
                    </div>
                  )}
                  {log.severity && (
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[100px]">Severity:</span>
                      <Badge
                        variant={
                          parseInt(log.severity) >= 3
                            ? "destructive"
                            : parseInt(log.severity) >= 2
                            ? "outline"
                            : "default"
                        }
                      >
                        Level {log.severity}
                      </Badge>
                    </div>
                  )}
                  {log.tags && log.tags.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[100px]">Tags:</span>
                      <div className="flex flex-wrap gap-1">
                        {log.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {log.file && (
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">Rule File:</span>
                      <div className="bg-muted px-3 py-2 rounded">
                        <code className="text-xs font-mono whitespace-pre-wrap break-all">
                          {log.file}
                        </code>
                      </div>
                    </div>
                  )}
                  {log.line && (
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[100px]">Line Number:</span>
                      <span>{log.line}</span>
                    </div>
                  )}
                  {log.uniqueId && (
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[100px]">Unique ID:</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {log.uniqueId}
                      </code>
                    </div>
                  )}
                  {log.data && (
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">Data:</span>
                      <div className="bg-muted px-3 py-2 rounded overflow-x-auto max-h-[200px] overflow-y-auto">
                        <code className="text-xs font-mono whitespace-pre-wrap break-words">
                          {log.data}
                        </code>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Message */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Message</h3>
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-medium whitespace-pre-wrap break-all">{log.message}</p>
              </div>
            </div>

            {/* Full Log Entry */}
            {log.fullMessage && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Complete Log Entry</h3>
                <div className="bg-muted p-3 rounded-md max-h-[300px] overflow-y-auto">
                  <pre className="text-xs whitespace-pre-wrap break-all font-mono">
                    {log.fullMessage}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
