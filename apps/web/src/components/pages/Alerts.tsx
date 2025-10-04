import { useState } from "react";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Send, Edit, Trash2, Mail, MessageSquare, Loader2, Bell } from "lucide-react";
import { NotificationChannel, AlertRule } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { SkeletonTable } from "@/components/ui/skeletons";
import {
  useSuspenseNotificationChannels,
  useSuspenseAlertRules,
  useCreateNotificationChannel,
  useUpdateNotificationChannel,
  useDeleteNotificationChannel,
  useTestNotificationChannel,
  useCreateAlertRule,
  useUpdateAlertRule,
  useDeleteAlertRule
} from "@/queries";

// Component for notification channels with suspense
function NotificationChannelsTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: channels } = useSuspenseNotificationChannels();
  const [isChannelDialogOpen, setIsChannelDialogOpen] = useState(false);

  const createNotificationChannel = useCreateNotificationChannel();
  const updateNotificationChannel = useUpdateNotificationChannel();
  const deleteNotificationChannel = useDeleteNotificationChannel();
  const testNotificationChannel = useTestNotificationChannel();

  const [channelForm, setChannelForm] = useState({
    name: "",
    type: "email" as "email" | "telegram",
    enabled: true,
    email: "",
    chatId: "",
    botToken: ""
  });

  const handleAddChannel = async () => {
    const config = channelForm.type === 'email'
      ? { email: channelForm.email }
      : { chatId: channelForm.chatId, botToken: channelForm.botToken };

    try {
      await createNotificationChannel.mutateAsync({
        name: channelForm.name,
        type: channelForm.type,
        enabled: channelForm.enabled,
        config
      });

      setIsChannelDialogOpen(false);
      resetChannelForm();
      toast({ title: "Notification channel added successfully" });
    } catch (error: any) {
      toast({
        title: "Error adding channel",
        description: error.response?.data?.message || "Failed to add channel",
        variant: "destructive"
      });
    }
  };

  const resetChannelForm = () => {
    setChannelForm({
      name: "",
      type: "email",
      enabled: true,
      email: "",
      chatId: "",
      botToken: ""
    });
  };

  const handleTestNotification = async (channelId: string) => {
    try {
      const channel = channels.find(c => c.id === channelId);
      const result = await testNotificationChannel.mutateAsync(channelId);
      toast({
        title: "Test notification sent",
        description: result.message || `Test message sent to ${channel?.name}`
      });
    } catch (error: any) {
      toast({
        title: "Error testing notification",
        description: error.response?.data?.message || "Failed to send test notification",
        variant: "destructive"
      });
    }
  };

  const handleDeleteChannel = async (id: string) => {
    try {
      await deleteNotificationChannel.mutateAsync(id);
      toast({ title: "Channel deleted successfully" });
    } catch (error: any) {
      toast({
        title: "Error deleting channel",
        description: error.response?.data?.message || "Failed to delete channel",
        variant: "destructive"
      });
    }
  };

  const handleToggleChannel = async (id: string) => {
    try {
      const channel = channels.find(c => c.id === id);
      if (!channel) return;

      await updateNotificationChannel.mutateAsync({
        id,
        data: { enabled: !channel.enabled }
      });
    } catch (error: any) {
      toast({
        title: "Error toggling channel",
        description: error.response?.data?.message || "Failed to toggle channel",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Notification Channels</CardTitle>
          <CardDescription>Configure email and Telegram notification channels</CardDescription>
        </div>
        <Dialog open={isChannelDialogOpen} onOpenChange={setIsChannelDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Channel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Notification Channel</DialogTitle>
              <DialogDescription>
                Configure a new notification channel
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="channel-name">Channel Name</Label>
                <Input
                  id="channel-name"
                  value={channelForm.name}
                  onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })}
                  placeholder="e.g., Admin Email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="channel-type">Type</Label>
                <Select value={channelForm.type} onValueChange={(value: any) => setChannelForm({ ...channelForm, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="telegram">Telegram</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {channelForm.type === 'email' ? (
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={channelForm.email}
                    onChange={(e) => setChannelForm({ ...channelForm, email: e.target.value })}
                    placeholder="admin@example.com"
                  />
                </div>
              ) : (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="chatId">Chat ID</Label>
                    <Input
                      id="chatId"
                      value={channelForm.chatId}
                      onChange={(e) => setChannelForm({ ...channelForm, chatId: e.target.value })}
                      placeholder="-1001234567890"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="botToken">Bot Token</Label>
                    <Input
                      id="botToken"
                      type="password"
                      value={channelForm.botToken}
                      onChange={(e) => setChannelForm({ ...channelForm, botToken: e.target.value })}
                      placeholder="1234567890:ABCdefGHI..."
                    />
                  </div>
                </>
              )}
              <div className="flex items-center space-x-2">
                <Switch
                  id="channel-enabled"
                  checked={channelForm.enabled}
                  onCheckedChange={(checked) => setChannelForm({ ...channelForm, enabled: checked })}
                />
                <Label htmlFor="channel-enabled">Enable channel</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsChannelDialogOpen(false)} disabled={createNotificationChannel.isPending}>Cancel</Button>
              <Button onClick={handleAddChannel} disabled={createNotificationChannel.isPending}>
                {createNotificationChannel.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Channel
              </Button>
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
                <TableHead>Type</TableHead>
                <TableHead>Configuration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channels.map((channel) => (
                <TableRow key={channel.id}>
                  <TableCell className="font-medium">{channel.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {channel.type === 'email' ? <Mail className="h-3 w-3 mr-1" /> : <MessageSquare className="h-3 w-3 mr-1" />}
                      {channel.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {channel.type === 'email' ? channel.config.email : channel.config.chatId}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={channel.enabled}
                      onCheckedChange={() => handleToggleChannel(channel.id)}
                    />
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleTestNotification(channel.id)}>
                      <Send className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteChannel(channel.id)}>
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
  );
}

// Component for alert rules with suspense
function AlertRulesTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: channels } = useSuspenseNotificationChannels();
  const { data: alertRules } = useSuspenseAlertRules();
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);

  const createAlertRule = useCreateAlertRule();
  const updateAlertRule = useUpdateAlertRule();
  const deleteAlertRule = useDeleteAlertRule();

  // Helper function to generate condition based on alert type
  const getConditionForAlertType = (alertType: "cpu" | "memory" | "disk" | "upstream" | "ssl"): string => {
    switch (alertType) {
      case "cpu":
        return "cpu > threshold";
      case "memory":
        return "memory > threshold";
      case "disk":
        return "disk > threshold";
      case "upstream":
        return "upstream_status == down";
      case "ssl":
        return "ssl_days_remaining < threshold";
      default:
        return "cpu > threshold";
    }
  };

  const [ruleForm, setRuleForm] = useState({
    name: "",
    alertType: "cpu" as "cpu" | "memory" | "disk" | "upstream" | "ssl",
    condition: getConditionForAlertType("cpu"),
    threshold: 80,
    severity: "warning" as "critical" | "warning" | "info",
    channels: [] as string[],
    enabled: true,
    checkInterval: 60
  });

  const handleAddRule = async () => {
    try {
      await createAlertRule.mutateAsync(ruleForm);
      setIsRuleDialogOpen(false);
      resetRuleForm();
      toast({ title: "Alert rule added successfully" });
    } catch (error: any) {
      toast({
        title: "Error adding rule",
        description: error.response?.data?.message || "Failed to add rule",
        variant: "destructive"
      });
    }
  };

  const resetRuleForm = () => {
    setRuleForm({
      name: "",
      alertType: "cpu",
      condition: getConditionForAlertType("cpu"),
      threshold: 80,
      severity: "warning",
      channels: [],
      enabled: true,
      checkInterval: 60
    });
  };

  // Update condition and defaults based on alert type
  const handleAlertTypeChange = (type: "cpu" | "memory" | "disk" | "upstream" | "ssl") => {
    let threshold = 80;
    let checkInterval = 60;
    let name = "";

    switch (type) {
      case "cpu":
        threshold = 80;
        checkInterval = 30;
        name = "High CPU Usage";
        break;
      case "memory":
        threshold = 85;
        checkInterval = 30;
        name = "High Memory Usage";
        break;
      case "disk":
        threshold = 90;
        checkInterval = 300; // 5 minutes
        name = "High Disk Usage";
        break;
      case "upstream":
        threshold = 1;
        checkInterval = 60;
        name = "Upstream Down";
        break;
      case "ssl":
        threshold = 30;
        checkInterval = 86400; // 1 day
        name = "SSL Certificate Expiring";
        break;
    }

    setRuleForm({
      ...ruleForm,
      alertType: type,
      condition: getConditionForAlertType(type),
      threshold,
      checkInterval,
      name: ruleForm.name || name
    });
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await deleteAlertRule.mutateAsync(id);
      toast({ title: "Rule deleted successfully" });
    } catch (error: any) {
      toast({
        title: "Error deleting rule",
        description: error.response?.data?.message || "Failed to delete rule",
        variant: "destructive"
      });
    }
  };

  const handleToggleRule = async (id: string) => {
    try {
      const rule = alertRules.find(r => r.id === id);
      if (!rule) return;

      await updateAlertRule.mutateAsync({
        id,
        data: { enabled: !rule.enabled }
      });
    } catch (error: any) {
      toast({
        title: "Error toggling rule",
        description: error.response?.data?.message || "Failed to toggle rule",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Alert Rules</CardTitle>
          <CardDescription>Define conditions and thresholds for alerts</CardDescription>
        </div>
        <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Alert Rule</DialogTitle>
              <DialogDescription>
                Configure a new alert rule
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="alert-type">Alert Type</Label>
                <Select value={ruleForm.alertType} onValueChange={handleAlertTypeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cpu">CPU Usage</SelectItem>
                    <SelectItem value="memory">Memory Usage</SelectItem>
                    <SelectItem value="disk">Disk Usage</SelectItem>
                    <SelectItem value="upstream">Upstream Health</SelectItem>
                    <SelectItem value="ssl">SSL Certificate</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {ruleForm.alertType === 'cpu' && 'Alert when CPU usage exceeds threshold'}
                  {ruleForm.alertType === 'memory' && 'Alert when memory usage exceeds threshold'}
                  {ruleForm.alertType === 'disk' && 'Alert when disk usage exceeds threshold'}
                  {ruleForm.alertType === 'upstream' && 'Alert when any upstream/backend is down'}
                  {ruleForm.alertType === 'ssl' && 'Alert when SSL certificate expires soon'}
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rule-name">Rule Name</Label>
                <Input
                  id="rule-name"
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  placeholder="e.g., High CPU Alert"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="condition">Condition</Label>
                <Input
                  id="condition"
                  value={ruleForm.condition}
                  onChange={(e) => setRuleForm({ ...ruleForm, condition: e.target.value })}
                  placeholder="e.g., cpu > threshold"
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Auto-filled based on alert type
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="threshold">
                    {ruleForm.alertType === 'ssl' ? 'Days Remaining' : 'Threshold (%)'}
                  </Label>
                  <Input
                    id="threshold"
                    type="number"
                    value={ruleForm.threshold}
                    onChange={(e) => setRuleForm({ ...ruleForm, threshold: Number(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">
                    {ruleForm.alertType === 'ssl' }
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="severity">Severity</Label>
                  <Select value={ruleForm.severity} onValueChange={(value: any) => setRuleForm({ ...ruleForm, severity: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="checkInterval">Check Interval (seconds)</Label>
                <Input
                  id="checkInterval"
                  type="number"
                  min="10"
                  max="86400"
                  value={ruleForm.checkInterval}
                  onChange={(e) => setRuleForm({ ...ruleForm, checkInterval: Number(e.target.value) })}
                  placeholder="60"
                />
                <p className="text-xs text-muted-foreground">
                  {ruleForm.alertType === 'ssl' 
                    ? 'SSL checks: 86400s (1 day) recommended' 
                    : 'How often to check (10-3600s). CPU/Memory: 30s, Disk: 300s'}
                </p>
              </div>
              <div className="grid gap-2">
                <Label>Notification Channels</Label>
                <div className="space-y-2">
                  {channels.filter(c => c.enabled).map(channel => (
                    <div key={channel.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`channel-${channel.id}`}
                        checked={ruleForm.channels.includes(channel.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRuleForm({ ...ruleForm, channels: [...ruleForm.channels, channel.id] });
                          } else {
                            setRuleForm({ ...ruleForm, channels: ruleForm.channels.filter(c => c !== channel.id) });
                          }
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={`channel-${channel.id}`} className="font-normal">
                        {channel.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="rule-enabled"
                  checked={ruleForm.enabled}
                  onCheckedChange={(checked) => setRuleForm({ ...ruleForm, enabled: checked })}
                />
                <Label htmlFor="rule-enabled">Enable rule</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRuleDialogOpen(false)} disabled={createAlertRule.isPending}>Cancel</Button>
              <Button onClick={handleAddRule} disabled={createAlertRule.isPending}>
                {createAlertRule.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Rule
              </Button>
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
                <TableHead>Condition</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Channels</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alertRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {rule.condition} ({rule.threshold})
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      rule.severity === 'critical' ? 'destructive' :
                      rule.severity === 'warning' ? 'secondary' : 'default'
                    }>
                      {rule.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {rule.channels.map(chId => {
                        const channel = channels.find(c => c.id === chId);
                        return channel ? (
                          <Badge key={chId} variant="outline" className="text-xs">
                            {channel.type === 'email' ? <Mail className="h-2 w-2" /> : <MessageSquare className="h-2 w-2" />}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={() => handleToggleRule(rule.id)}
                    />
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteRule(rule.id)}>
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
  );
}

// Main Alerts component
const Alerts = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Alerts & Notifications</h1>
            <p className="text-muted-foreground">Configure alert rules and notification channels</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="channels" className="space-y-4">
        <TabsList>
          <TabsTrigger value="channels">Notification Channels</TabsTrigger>
          <TabsTrigger value="rules">Alert Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-4">
          <Suspense fallback={<SkeletonTable rows={5} columns={5} title="Notification Channels" />}>
            <NotificationChannelsTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Suspense fallback={<SkeletonTable rows={5} columns={6} title="Alert Rules" />}>
            <AlertRulesTab />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Alerts;
