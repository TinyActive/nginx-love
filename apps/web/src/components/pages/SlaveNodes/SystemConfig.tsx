import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Server, Link as LinkIcon, CheckCircle2, AlertCircle, Loader2, RefreshCw, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { systemConfigService } from "@/services/system-config.service";

interface SystemConfigProps {
  systemConfig: any;
  isLoading: boolean;
}

const SystemConfig = ({ systemConfig, isLoading }: SystemConfigProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form data for Connect to Master (Slave mode)  
  const [masterFormData, setMasterFormData] = useState({
    masterHost: systemConfig?.masterHost || "",
    masterPort: systemConfig?.masterPort || 3001,
    masterApiKey: "",
    syncInterval: systemConfig?.syncInterval || 60
  });
  
  const [isMasterDialogOpen, setIsMasterDialogOpen] = useState(false);
  const [disconnectDialog, setDisconnectDialog] = useState(false);

  // Confirm mode change dialog
  const [modeChangeDialog, setModeChangeDialog] = useState<{ open: boolean; newMode: 'master' | 'slave' | null }>({
    open: false,
    newMode: null
  });

  // Update node mode mutation
  const updateNodeModeMutation = useMutation({
    mutationFn: systemConfigService.updateNodeMode,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] });
      
      toast({
        title: "Node mode changed",
        description: `Node is now in ${data.data.nodeMode} mode`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to change mode",
        description: error.response?.data?.message || "An error occurred",
        variant: "destructive"
      });
    }
  });

  // Connect to master mutation (Slave mode)
  const connectToMasterMutation = useMutation({
    mutationFn: systemConfigService.connectToMaster,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] });
      setIsMasterDialogOpen(false);
      resetMasterForm();
      
      toast({
        title: "Connected to master",
        description: `Successfully connected to ${data.data.masterHost}:${data.data.masterPort}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Connection failed",
        description: error.response?.data?.message || "Failed to connect to master",
        variant: "destructive"
      });
    }
  });

  // Disconnect from master mutation
  const disconnectMutation = useMutation({
    mutationFn: systemConfigService.disconnectFromMaster,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] });
      
      toast({
        title: "Disconnected",
        description: "Disconnected from master node",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Disconnect failed",
        description: error.response?.data?.message || "Failed to disconnect",
        variant: "destructive"
      });
    }
  });

  // Test master connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: systemConfigService.testMasterConnection,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] });
      
      toast({
        title: "Connection test successful",
        description: `Latency: ${data.data.latency}ms | Master: ${data.data.masterStatus}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Connection test failed",
        description: error.response?.data?.message || "Failed to connect",
        variant: "destructive"
      });
    }
  });

  // Sync from master mutation (slave pulls config)
  const syncFromMasterMutation = useMutation({
    mutationFn: systemConfigService.syncWithMaster,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] });
      
      toast({
        title: "Sync completed",
        description: `${data.data.changesApplied} changes applied from master`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync failed",
        description: error.response?.data?.message || "Failed to sync with master",
        variant: "destructive"
      });
    }
  });

  const handleConnectToMaster = () => {
    if (!masterFormData.masterHost || !masterFormData.masterApiKey) {
      toast({
        title: "Validation error",
        description: "Master host and API key are required",
        variant: "destructive"
      });
      return;
    }

    if (masterFormData.syncInterval < 10) {
      toast({
        title: "Validation error",
        description: "Sync interval must be at least 10 seconds",
        variant: "destructive"
      });
      return;
    }

    connectToMasterMutation.mutate({
      masterHost: masterFormData.masterHost,
      masterPort: masterFormData.masterPort,
      masterApiKey: masterFormData.masterApiKey,
      syncInterval: masterFormData.syncInterval
    });
  };

  const resetMasterForm = () => {
    setMasterFormData({
      masterHost: systemConfig?.masterHost || "",
      masterPort: systemConfig?.masterPort || 3001,
      masterApiKey: "",
      syncInterval: systemConfig?.syncInterval || 60
    });
  };

  const handleModeChange = (newMode: 'master' | 'slave') => {
    if (systemConfig?.nodeMode === newMode) return;

    // Show custom dialog instead of browser confirm
    setModeChangeDialog({
      open: true,
      newMode
    });
  };

  const confirmModeChange = () => {
    if (modeChangeDialog.newMode) {
      updateNodeModeMutation.mutate(modeChangeDialog.newMode);
      setModeChangeDialog({ open: false, newMode: null });
    }
  };

  const currentMode = systemConfig?.nodeMode || 'master';
  const isMasterMode = currentMode === 'master';
  const isSlaveMode = currentMode === 'slave';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Server className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Node Synchronization</h1>
            <p className="text-muted-foreground">Manage master-slave node configuration</p>
          </div>
        </div>
      </div>

      {/* Node Mode Status Card */}
      {isLoading ? (
        // Skeleton for Alert component
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-4" />
              <div>
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
      ) : (
        <Alert className={isMasterMode ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-green-500 bg-green-50 dark:bg-green-900/20'}>
          {isMasterMode ? (
            <Server className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          ) : (
            <LinkIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
          )}
          <AlertTitle>
            Current Mode: <span className={isMasterMode ? 'text-blue-700 dark:text-blue-300' : 'text-green-700 dark:text-green-300'}>
              {isMasterMode ? 'MASTER' : 'SLAVE'}
            </span>
          </AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              {isMasterMode ? 'This node can register and manage slave nodes' : 'This node is connected to a master node'}
            </span>
            <div className="flex items-center gap-2">
              {isSlaveMode && systemConfig?.connected && (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Connected to Master
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleModeChange(isMasterMode ? 'slave' : 'master')}
                disabled={updateNodeModeMutation.isPending}
              >
                {updateNodeModeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  isMasterMode ? (
                    <LinkIcon className="h-4 w-4 mr-2" />
                  ) : (
                    <Server className="h-4 w-4 mr-2" />
                  )
                )}
                Switch to {isMasterMode ? 'Slave' : 'Master'} Mode
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Slave Mode Configuration */}
      {!isLoading && isSlaveMode && (
        <Card>
          <CardContent className="pt-6">
            {!systemConfig?.connected ? (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You are in Slave Mode but not connected to any master node.
                    Click "Connect to Master" to configure the connection.
                  </AlertDescription>
                </Alert>

                <Button className="w-full" onClick={() => setIsMasterDialogOpen(true)}>
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Connect to Master Node
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Connected to Master</span>
                  </div>
                  <Badge variant="default" className="bg-green-600">
                    Active
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Master Host:</span>
                    <span className="font-mono">{systemConfig.masterHost}:{systemConfig.masterPort}</span>
                  </div>
                  {systemConfig.lastConnectedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Connected:</span>
                      <span>{new Date(systemConfig.lastConnectedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => syncFromMasterMutation.mutate()}
                    disabled={syncFromMasterMutation.isPending}
                  >
                    {syncFromMasterMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Sync from Master
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testConnectionMutation.mutate()}
                    disabled={testConnectionMutation.isPending}
                  >
                    {testConnectionMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Test Connection
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDisconnectDialog(true)}
                    disabled={disconnectMutation.isPending}
                  >
                    {disconnectMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Disconnect
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mode Change Confirmation Dialog */}
      <Dialog open={modeChangeDialog.open} onOpenChange={(open) => setModeChangeDialog({ ...modeChangeDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Confirm Mode Change
            </DialogTitle>
            <DialogDescription>
              {modeChangeDialog.newMode === 'slave'
                ? "Switching to Slave mode will disable the ability to register slave nodes. You will need to connect to a master node."
                : "Switching to Master mode will disconnect from the current master and allow you to register slave nodes."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setModeChangeDialog({ open: false, newMode: null })}
              disabled={updateNodeModeMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmModeChange}
              disabled={updateNodeModeMutation.isPending}
            >
              {updateNodeModeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {updateNodeModeMutation.isPending ? 'Changing...' : 'Continue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Connect to Master Dialog */}
      <Dialog open={isMasterDialogOpen} onOpenChange={setIsMasterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect to Master Node</DialogTitle>
            <DialogDescription>
              Enter the master node details and API key to establish connection
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="masterHost">Master Host/IP</Label>
              <Input
                id="masterHost"
                value={masterFormData.masterHost}
                onChange={(e) => setMasterFormData({ ...masterFormData, masterHost: e.target.value })}
                placeholder="Enter master node IP address"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="masterPort">Master Port</Label>
              <Input
                id="masterPort"
                type="number"
                value={masterFormData.masterPort}
                onChange={(e) => setMasterFormData({ ...masterFormData, masterPort: Number(e.target.value) })}
                placeholder="3001"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="masterApiKey">Master API Key</Label>
              <Input
                id="masterApiKey"
                type="password"
                value={masterFormData.masterApiKey}
                onChange={(e) => setMasterFormData({ ...masterFormData, masterApiKey: e.target.value })}
                placeholder="Enter API key from master node"
              />
              <p className="text-xs text-muted-foreground">
                Get this API key from the master node when registering this slave
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="syncInterval">Sync Interval (seconds)</Label>
              <Input
                id="syncInterval"
                type="number"
                value={masterFormData.syncInterval}
                onChange={(e) => setMasterFormData({ ...masterFormData, syncInterval: Number(e.target.value) })}
                placeholder="60"
              />
              <p className="text-xs text-muted-foreground">
                How often to pull configuration from master (minimum: 10 seconds)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMasterDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConnectToMaster}
              disabled={connectToMasterMutation.isPending}
            >
              {connectToMasterMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={disconnectDialog} onOpenChange={setDisconnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Confirm Disconnect
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect from the master node? You will need to reconnect manually.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDisconnectDialog(false)}
              disabled={disconnectMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                disconnectMutation.mutate();
                setDisconnectDialog(false);
              }}
              disabled={disconnectMutation.isPending}
            >
              {disconnectMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SystemConfig;