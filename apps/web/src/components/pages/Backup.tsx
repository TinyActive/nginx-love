import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Download, Upload, Play, Trash2, Calendar, FileArchive, Database } from "lucide-react";
import { mockBackups } from "@/mocks/data";
import { BackupConfig } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { UnderConstructionBanner } from "@/components/ui/under-construction-banner";

const Backup = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [backups, setBackups] = useState<BackupConfig[]>(mockBackups);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    schedule: "0 2 * * *",
    enabled: true
  });

  const handleAddBackup = () => {
    const newBackup: BackupConfig = {
      id: `bk${backups.length + 1}`,
      name: formData.name,
      schedule: formData.schedule,
      enabled: formData.enabled,
      status: 'pending'
    };
    setBackups([...backups, newBackup]);
    setIsDialogOpen(false);
    resetForm();
    toast({ title: "Backup schedule created successfully" });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      schedule: "0 2 * * *",
      enabled: true
    });
  };

  const handleToggle = (id: string) => {
    setBackups(backups.map(b => b.id === id ? { ...b, enabled: !b.enabled } : b));
  };

  const handleDelete = (id: string) => {
    setBackups(backups.filter(b => b.id !== id));
    toast({ title: "Backup schedule deleted" });
  };

  const handleRunNow = (id: string) => {
    toast({ 
      title: "Backup started",
      description: "Manual backup is running (mock mode)"
    });
  };

  const handleExportConfig = () => {
    const config = {
      domains: "Mock domain configurations",
      ssl: "Mock SSL certificates",
      modsec: "Mock ModSecurity rules",
      settings: "Mock system settings"
    };
    const dataStr = JSON.stringify(config, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `nginx-config-${new Date().toISOString()}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast({ title: "Configuration exported successfully" });
  };

  const handleImportConfig = () => {
    toast({ 
      title: "Import configuration",
      description: "Select a backup file to restore (mock mode)"
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'default';
      case 'failed': return 'destructive';
      case 'running': return 'secondary';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <UnderConstructionBanner />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Database className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Backup & Restore</h1>
            <p className="text-muted-foreground">Manage configuration backups and restore points</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Export Configuration</CardTitle>
            <CardDescription>Download current system configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Export all domains, SSL certificates, ModSecurity rules, and system settings to a JSON file.
            </p>
            <Button onClick={handleExportConfig} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Export Configuration
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Import Configuration</CardTitle>
            <CardDescription>Restore from a backup file</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Import and restore configuration from a previously exported backup file.
            </p>
            <Button onClick={handleImportConfig} variant="outline" className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Import Configuration
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Scheduled Backups</CardTitle>
            <CardDescription>Automated backup schedules</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Add Schedule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Backup Schedule</DialogTitle>
                <DialogDescription>
                  Configure automatic backup schedule using cron syntax
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Backup Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Daily Full Backup"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="schedule">Cron Schedule</Label>
                  <Input
                    id="schedule"
                    value={formData.schedule}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                    placeholder="0 2 * * *"
                  />
                  <p className="text-xs text-muted-foreground">
                    Examples: "0 2 * * *" (daily at 2 AM), "0 */6 * * *" (every 6 hours)
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enabled"
                    checked={formData.enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                  />
                  <Label htmlFor="enabled">Enable schedule</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddBackup}>Create Schedule</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Enabled</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map((backup) => (
                  <TableRow key={backup.id}>
                    <TableCell className="font-medium">{backup.name}</TableCell>
                    <TableCell className="font-mono text-sm">{backup.schedule}</TableCell>
                    <TableCell className="text-sm">
                      {backup.lastRun ? new Date(backup.lastRun).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {backup.nextRun ? new Date(backup.nextRun).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(backup.status)}>
                        {backup.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{backup.size || '-'}</TableCell>
                    <TableCell>
                      <Switch
                        checked={backup.enabled}
                        onCheckedChange={() => handleToggle(backup.id)}
                      />
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleRunNow(backup.id)}>
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(backup.id)}>
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
          <CardTitle>Backup Information</CardTitle>
          <CardDescription>Important notes about backup and restore</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-start gap-2">
            <FileArchive className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">What gets backed up?</p>
              <p className="text-sm text-muted-foreground">
                All domain configurations, SSL certificates, ModSecurity rules, ACL rules, alert settings, and system preferences.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <FileArchive className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Restore Process</p>
              <p className="text-sm text-muted-foreground">
                Importing a backup will merge configurations. Existing items with the same ID will be updated.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <FileArchive className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Best Practices</p>
              <p className="text-sm text-muted-foreground">
                Keep multiple backup versions, test restore procedures regularly, and store backups in a secure location.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Backup;
