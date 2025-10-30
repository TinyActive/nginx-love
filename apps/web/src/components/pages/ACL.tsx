import { useState, useEffect } from "react";
import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Download, Upload, Trash2, Edit, Loader2, UserCog, AlertCircle, CheckCircle2, Info, FileCode } from "lucide-react";
import { ACLRule } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { SkeletonTable } from "@/components/ui/skeletons";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { validateAclValue, getValidationHints, getExampleValue } from "@/utils/acl-validators";
import { PreviewConfigDialog } from "@/components/acl/PreviewConfigDialog";
import {
  useSuspenseAclRules,
  useCreateAclRule,
  useUpdateAclRule,
  useDeleteAclRule,
  useToggleAclRule,
  useApplyAclRules
} from "@/queries";

// Component for ACL rules table with suspense
function AclRulesTable() {
  const { toast } = useToast();
  const { data: rules } = useSuspenseAclRules();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ACLRule | null>(null);
  const [ruleToDelete, setRuleToDelete] = useState<{ id: string; name: string } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const createAclRule = useCreateAclRule();
  const updateAclRule = useUpdateAclRule();
  const deleteAclRule = useDeleteAclRule();
  const toggleAclRule = useToggleAclRule();
  const applyAclRules = useApplyAclRules();

  const [formData, setFormData] = useState({
    name: "",
    type: "blacklist" as "whitelist" | "blacklist",
    field: "ip" as "ip" | "geoip" | "user-agent" | "url" | "method" | "header",
    operator: "equals" as "equals" | "contains" | "regex",
    value: "",
    action: "deny" as "allow" | "deny" | "challenge",
    enabled: true
  });

  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState(false);

  // Real-time validation when value changes
  useEffect(() => {
    if (formData.value.trim().length === 0) {
      setValidationError(null);
      setValidationSuccess(false);
      return;
    }

    const result = validateAclValue(formData.field, formData.operator, formData.value);
    if (result.valid) {
      setValidationError(null);
      setValidationSuccess(true);
    } else {
      setValidationError(result.error || 'Invalid value');
      setValidationSuccess(false);
    }
  }, [formData.value, formData.field, formData.operator]);

  // Auto-adjust action based on type
  useEffect(() => {
    if (formData.type === 'whitelist' && formData.action === 'deny') {
      setFormData(prev => ({ ...prev, action: 'allow' }));
    } else if (formData.type === 'blacklist' && formData.action === 'allow') {
      setFormData(prev => ({ ...prev, action: 'deny' }));
    }
  }, [formData.type]);

  // Reset validation when field or operator changes
  useEffect(() => {
    setValidationError(null);
    setValidationSuccess(false);
    if (formData.value.trim().length > 0) {
      const result = validateAclValue(formData.field, formData.operator, formData.value);
      if (result.valid) {
        setValidationSuccess(true);
      } else {
        setValidationError(result.error || 'Invalid value');
      }
    }
  }, [formData.field, formData.operator]);

  const handleAddRule = async () => {
    // Validate before submission
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Rule name is required",
        variant: "destructive"
      });
      return;
    }

    if (!formData.value.trim()) {
      toast({
        title: "Validation Error",
        description: "Condition value is required",
        variant: "destructive"
      });
      return;
    }

    // Validate value
    const valueValidation = validateAclValue(formData.field, formData.operator, formData.value);
    if (!valueValidation.valid) {
      toast({
        title: "Validation Error",
        description: valueValidation.error || "Invalid condition value",
        variant: "destructive"
      });
      return;
    }

    // Transform field format: user-agent -> user_agent for backend
    const conditionField = formData.field.replace('-', '_') as any;

    try {
      if (editingRule) {
        await updateAclRule.mutateAsync({
          id: editingRule.id,
          data: {
            name: formData.name,
            type: formData.type,
            conditionField,
            conditionOperator: formData.operator,
            conditionValue: formData.value,
            action: formData.action,
            enabled: formData.enabled
          }
        });
        toast({ title: "Rule updated successfully" });
      } else {
        await createAclRule.mutateAsync({
          name: formData.name,
          type: formData.type,
          conditionField,
          conditionOperator: formData.operator,
          conditionValue: formData.value,
          action: formData.action,
          enabled: formData.enabled
        });
        toast({ title: "Rule added successfully" });
      }

      setIsDialogOpen(false);
      setEditingRule(null);
      resetForm();
    } catch (error: any) {
      toast({
        title: editingRule ? "Error updating rule" : "Error adding rule",
        description: error.response?.data?.message || "Operation failed",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "blacklist",
      field: "ip",
      operator: "equals",
      value: "",
      action: "deny",
      enabled: true
    });
    setValidationError(null);
    setValidationSuccess(false);
  };

  const handleEdit = (rule: ACLRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      type: rule.type,
      field: rule.condition.field,
      operator: rule.condition.operator,
      value: rule.condition.value,
      action: rule.action,
      enabled: rule.enabled
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!ruleToDelete) return;

    try {
      await deleteAclRule.mutateAsync(ruleToDelete.id);
      toast({ title: "Rule deleted successfully" });
      setRuleToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error deleting rule",
        description: error.response?.data?.message || "Failed to delete rule",
        variant: "destructive"
      });
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleAclRule.mutateAsync(id);
    } catch (error: any) {
      toast({
        title: "Error toggling rule",
        description: error.response?.data?.message || "Failed to toggle rule",
        variant: "destructive"
      });
    }
  };

  const handleApplyRules = async () => {
    try {
      const result = await applyAclRules.mutateAsync();
      toast({
        title: result.success ? "Success" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
    } catch (error: any) {
      toast({
        title: "Error applying rules",
        description: error.response?.data?.message || "Failed to apply ACL rules to Nginx",
        variant: "destructive"
      });
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(rules, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `acl-rules-${new Date().toISOString()}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast({ title: "Rules exported successfully" });
  };

  const handleImport = () => {
    toast({ title: "Import feature (mock mode)", description: "Select a JSON file to import rules" });
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <UserCog className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Access Control List (ACL)</h1>
            <p className="text-muted-foreground">Manage IP whitelists, blacklists, and access rules</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
            <FileCode className="h-4 w-4 mr-2" />
            Preview Config
          </Button>
          <Button variant="secondary" size="sm" onClick={handleApplyRules} disabled={applyAclRules.isPending}>
            {applyAclRules.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Apply Rules to Nginx
          </Button>
          <Button variant="outline" size="sm" onClick={handleImport}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingRule(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingRule ? "Edit ACL Rule" : "Add ACL Rule"}</DialogTitle>
                <DialogDescription>
                  Configure access control rules for your domains
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Rule Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Block Malicious IPs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Type</Label>
                    <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="whitelist">Whitelist</SelectItem>
                        <SelectItem value="blacklist">Blacklist</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="action">Action</Label>
                    <Select value={formData.action} onValueChange={(value: any) => setFormData({ ...formData, action: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="allow">Allow</SelectItem>
                        <SelectItem value="deny">Deny</SelectItem>
                        <SelectItem value="challenge">Challenge</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="field">Field</Label>
                    <Select value={formData.field} onValueChange={(value: any) => setFormData({ ...formData, field: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ip">IP Address</SelectItem>
                        <SelectItem value="geoip">GeoIP</SelectItem>
                        <SelectItem value="user-agent">User-Agent</SelectItem>
                        <SelectItem value="url">URL</SelectItem>
                        <SelectItem value="method">Method</SelectItem>
                        <SelectItem value="header">Header</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="operator">Operator</Label>
                    <Select value={formData.operator} onValueChange={(value: any) => setFormData({ ...formData, operator: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="regex">Regex</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="value">Value</Label>
                    <div className="relative">
                      <Input
                        id="value"
                        value={formData.value}
                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                        placeholder={getExampleValue(formData.field, formData.operator)}
                        className={validationError ? 'border-red-500' : validationSuccess ? 'border-green-500' : ''}
                      />
                      {validationSuccess && formData.value.trim().length > 0 && (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                      )}
                      {validationError && (
                        <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Validation feedback */}
                {validationError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{validationError}</AlertDescription>
                  </Alert>
                )}
                
                {/* Hints */}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Hint:</strong> {getValidationHints(formData.field, formData.operator)}
                  </AlertDescription>
                </Alert>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enabled"
                    checked={formData.enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                  />
                  <Label htmlFor="enabled">Enable rule immediately</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={createAclRule.isPending || updateAclRule.isPending}>Cancel</Button>
                <Button 
                  onClick={handleAddRule} 
                  disabled={
                    createAclRule.isPending || 
                    updateAclRule.isPending || 
                    !formData.name.trim() || 
                    !formData.value.trim() || 
                    !!validationError
                  }
                >
                  {(createAclRule.isPending || updateAclRule.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingRule ? "Update" : "Add"} Rule
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ACL Rules ({rules.length})</CardTitle>
          <CardDescription>Manage access control rules for your infrastructure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>
                      <Badge variant={rule.type === 'whitelist' ? 'default' : 'destructive'}>
                        {rule.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {rule.condition.field} {rule.condition.operator} "{rule.condition.value}"
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        rule.action === 'allow' ? 'default' :
                        rule.action === 'deny' ? 'destructive' : 'secondary'
                      }>
                        {rule.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={() => handleToggle(rule.id)}
                      />
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(rule)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setRuleToDelete({ id: rule.id, name: rule.name })}
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

      <ConfirmDialog
        open={!!ruleToDelete}
        onOpenChange={(open) => !open && setRuleToDelete(null)}
        onConfirm={handleDelete}
        title="Delete ACL Rule"
        description={`Are you sure you want to delete the rule "${ruleToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
      />

      <PreviewConfigDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </>
  );
}

// Main ACL component
const ACL = () => {
  return (
    <div className="space-y-6">
      <Suspense fallback={<SkeletonTable rows={8} columns={6} title="ACL Rules" />}>
        <AclRulesTable />
      </Suspense>
    </div>
  );
};

export default ACL;
