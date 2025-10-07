import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SkeletonTable } from "@/components/ui/skeletons";
import { Server, RefreshCw, Trash2, CheckCircle2, XCircle, Clock, AlertCircle, Loader2, KeyRound } from "lucide-react";
import { SlaveNode } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { slaveNodesQueryOptions } from "@/queries/slave.query-options";
import { slaveNodeService } from "@/services/slave.service";

interface SlaveNodesProps {
  systemConfig: any;
}

const SlaveNodes = ({ systemConfig }: SlaveNodesProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form data for Register Slave Node
  const [slaveFormData, setSlaveFormData] = useState({
    name: "",
    host: "",
    port: 3001,
    syncInterval: 60
  });
  
  const [apiKeyDialog, setApiKeyDialog] = useState<{ open: boolean; apiKey: string }>({
    open: false,
    apiKey: ''
  });

  // Delete node confirm dialog
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; nodeId: string | null }>({
    open: false,
    nodeId: null
  });

  // Fetch slave nodes
  const { data: nodes = [], isLoading: isNodesLoading } = useQuery({
    ...slaveNodesQueryOptions.all,
    refetchInterval: 30000 // Refetch every 30 seconds to update status
  });

  // Register slave node mutation
  const registerMutation = useMutation({
    mutationFn: slaveNodeService.register,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['slave-nodes'] });
      setIsDialogOpen(false);
      resetSlaveForm();
      
      // Show API key in separate dialog (critical info!)
      setApiKeyDialog({
        open: true,
        apiKey: data.data.apiKey
      });
      
      toast({ 
        title: "Slave node registered successfully",
        description: `Node ${data.data.name} has been registered`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.response?.data?.message || "Failed to register node",
        variant: "destructive",
        duration: 5000
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: slaveNodeService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slave-nodes'] });
      toast({ title: "Node removed successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.response?.data?.message || "Failed to delete node",
        variant: "destructive"
      });
    }
  });

  const handleRegisterSlave = () => {
    if (!slaveFormData.name || !slaveFormData.host) {
      toast({
        title: "Validation error",
        description: "Name and host are required",
        variant: "destructive"
      });
      return;
    }

    registerMutation.mutate({
      name: slaveFormData.name,
      host: slaveFormData.host,
      port: slaveFormData.port,
      syncInterval: slaveFormData.syncInterval
    });
  };

  const resetSlaveForm = () => {
    setSlaveFormData({
      name: "",
      host: "",
      port: 3001,
      syncInterval: 60
    });
  };

  const handleDelete = (id: string) => {
    setDeleteDialog({ open: true, nodeId: id });
  };

  const confirmDelete = () => {
    if (deleteDialog.nodeId) {
      deleteMutation.mutate(deleteDialog.nodeId);
      setDeleteDialog({ open: false, nodeId: null });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'default';
      case 'offline': return 'destructive';
      case 'syncing': return 'secondary';
      case 'error': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle2 className="h-4 w-4" />;
      case 'offline': return <XCircle className="h-4 w-4" />;
      case 'syncing': return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Master Node Configuration</CardTitle>
          <CardDescription>
            Register slave nodes and manage distributed configuration sync
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">Registered Slave Nodes</h3>
              <p className="text-sm text-muted-foreground">
                {isNodesLoading 
                  ? "Loading slave nodes..." 
                  : `${nodes.length} slave node(s) registered - Slaves will pull config automatically`
                }
              </p>
            </div>
            <div className="flex gap-2">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Server className="h-4 w-4 mr-2" />
                    Register Slave Node
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Register Slave Node</DialogTitle>
                    <DialogDescription>
                      Add a new slave node to receive configuration updates
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Node Name</Label>
                      <Input
                        id="name"
                        value={slaveFormData.name}
                        onChange={(e) => setSlaveFormData({ ...slaveFormData, name: e.target.value })}
                        placeholder="slave-node-01"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="host">Slave Host/IP</Label>
                      <Input
                        id="host"
                        value={slaveFormData.host}
                        onChange={(e) => setSlaveFormData({ ...slaveFormData, host: e.target.value })}
                        placeholder="Enter slave node IP address"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="port">Port</Label>
                      <Input
                        id="port"
                        type="number"
                        value={slaveFormData.port}
                        onChange={(e) => setSlaveFormData({ ...slaveFormData, port: Number(e.target.value) })}
                        placeholder="3001"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleRegisterSlave}
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Register
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Slave Nodes Table or Skeleton */}
          {isNodesLoading ? (
            <SkeletonTable rows={5} columns={6} showCard={false} />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Host:Port</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Seen</TableHead>
                    <TableHead>Config Hash</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nodes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No slave nodes registered. Click "Register Slave Node" to add one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    nodes.map((node) => (
                      <TableRow key={node.id}>
                        <TableCell className="font-medium">{node.name}</TableCell>
                        <TableCell className="font-mono text-sm">{node.host}:{node.port}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(node.status)}>
                            {getStatusIcon(node.status)}
                            <span className="ml-1">{node.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {node.lastSeen ? new Date(node.lastSeen).toLocaleString() : 'Never'}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {node.configHash?.substring(0, 12) || 'N/A'}...
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(node.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Key Dialog */}
      <Dialog open={apiKeyDialog.open} onOpenChange={(open) => setApiKeyDialog({ ...apiKeyDialog, open })}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-yellow-500" />
              Slave Node API Key
            </DialogTitle>
            <DialogDescription>
              Save this API key! You'll need it to connect the slave node to this master.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This API key will only be shown once. Copy it now and store it securely.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="apiKey"
                  value={apiKeyDialog.apiKey}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(apiKeyDialog.apiKey);
                    toast({
                      title: "Copied!",
                      description: "API key copied to clipboard"
                    });
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium">Next Steps:</p>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Go to the slave node web interface</li>
                <li>Switch to <strong>Slave Mode</strong></li>
                <li>Click "Connect to Master Node"</li>
                <li>Enter this API key along with master host/port</li>
                <li>Click "Connect" to establish synchronization</li>
              </ol>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setApiKeyDialog({ open: false, apiKey: '' })}>
              I've Saved the API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Node Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this slave node? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialog({ open: false, nodeId: null })}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Node'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SlaveNodes;