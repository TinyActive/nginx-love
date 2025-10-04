import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Server, RefreshCw, Send, Trash2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { mockSlaveNodes } from "@/mocks/data";
import { SlaveNode } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { UnderConstructionBanner } from "@/components/ui/under-construction-banner";

const SlaveNodes = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [nodes, setNodes] = useState<SlaveNode[]>(mockSlaveNodes);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    host: "",
    port: 8088
  });

  const handleAddNode = () => {
    const newNode: SlaveNode = {
      id: `node${nodes.length + 1}`,
      name: formData.name,
      host: formData.host,
      port: formData.port,
      status: 'offline',
      lastSeen: new Date().toISOString(),
      version: '1.24.0',
      syncStatus: {
        lastSync: new Date().toISOString(),
        configHash: '',
        inSync: false
      }
    };
    setNodes([...nodes, newNode]);
    setIsDialogOpen(false);
    resetForm();
    toast({ title: "Slave node registered", description: "Node added successfully" });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      host: "",
      port: 8088
    });
  };

  const handlePushConfig = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    toast({ 
      title: "Configuration pushed",
      description: `Config sync initiated to ${node?.name} (mock mode)`
    });
  };

  const handleSync = (nodeId: string) => {
    setNodes(nodes.map(n => 
      n.id === nodeId 
        ? { 
            ...n, 
            status: 'syncing',
            syncStatus: { ...n.syncStatus, lastSync: new Date().toISOString() }
          }
        : n
    ));
    setTimeout(() => {
      setNodes(nodes.map(n => 
        n.id === nodeId 
          ? { ...n, status: 'online', syncStatus: { ...n.syncStatus, inSync: true } }
          : n
      ));
      toast({ title: "Sync completed" });
    }, 2000);
  };

  const handleDelete = (id: string) => {
    setNodes(nodes.filter(n => n.id !== id));
    toast({ title: "Node removed" });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'default';
      case 'offline': return 'destructive';
      case 'syncing': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle2 className="h-4 w-4" />;
      case 'offline': return <XCircle className="h-4 w-4" />;
      case 'syncing': return <RefreshCw className="h-4 w-4 animate-spin" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <UnderConstructionBanner />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Server className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Slave Nodes</h1>
            <p className="text-muted-foreground">Manage distributed nginx nodes and configuration sync</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Server className="h-4 w-4 mr-2" />
              Register Node
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register Slave Node</DialogTitle>
              <DialogDescription>
                Add a new slave node to the cluster
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Node Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="nginx-slave-04"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="host">Host/IP Address</Label>
                <Input
                  id="host"
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  placeholder="10.0.10.14"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: Number(e.target.value) })}
                  placeholder="8088"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddNode}>Register Node</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Nodes</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nodes.length}</div>
            <p className="text-xs text-muted-foreground">
              Registered slave nodes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Nodes</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {nodes.filter(n => n.status === 'online').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Active and healthy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {nodes.filter(n => n.syncStatus.inSync).length}/{nodes.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Nodes in sync
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Nodes ({nodes.length})</CardTitle>
          <CardDescription>View and manage slave node cluster</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Host:Port</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead>Sync Status</TableHead>
                  <TableHead>Config Hash</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nodes.map((node) => (
                  <TableRow key={node.id}>
                    <TableCell className="font-medium">{node.name}</TableCell>
                    <TableCell className="font-mono text-sm">{node.host}:{node.port}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(node.status)}>
                        {getStatusIcon(node.status)}
                        <span className="ml-1">{node.status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>{node.version}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(node.lastSeen).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {node.syncStatus.inSync ? (
                        <Badge variant="default">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          In Sync
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Out of Sync
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {node.syncStatus.configHash || 'N/A'}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleSync(node.id)}
                        disabled={node.status === 'syncing'}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handlePushConfig(node.id)}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(node.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cluster Topology</CardTitle>
          <CardDescription>Visual representation of node cluster</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8 space-x-4">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-lg bg-primary flex items-center justify-center mb-2">
                <Server className="h-10 w-10 text-primary-foreground" />
              </div>
              <p className="text-sm font-medium">Master Node</p>
              <p className="text-xs text-muted-foreground">Primary</p>
            </div>
            <div className="flex-1 h-0.5 bg-border"></div>
            <div className="grid grid-cols-3 gap-4">
              {nodes.map((node) => (
                <div key={node.id} className="flex flex-col items-center">
                  <div className={`w-16 h-16 rounded-lg ${
                    node.status === 'online' ? 'bg-green-100 dark:bg-green-900' : 
                    node.status === 'syncing' ? 'bg-yellow-100 dark:bg-yellow-900' :
                    'bg-red-100 dark:bg-red-900'
                  } flex items-center justify-center mb-2`}>
                    <Server className="h-8 w-8" />
                  </div>
                  <p className="text-xs font-medium">{node.name}</p>
                  <Badge variant={getStatusColor(node.status)} className="text-xs mt-1">
                    {node.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SlaveNodes;
