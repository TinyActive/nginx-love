import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Globe, Plus, Trash2, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  botProfileQueryOptions,
  useUpdateBotProfile,
  useCreateBotRule,
  useDeleteBotRule,
  useToggleBotRule,
  useAssignBotProfileDomain,
  useRemoveBotProfileDomain,
  useApplyBotRules,
} from '@/queries/bot-manager.query-options';
import { domainQueryOptions } from '@/queries/domain.query-options';
import {
  FINGERPRINT_TYPE_LABELS,
  truncateFingerprint,
  parseFingerprintLines,
  validateFingerprintLines,
} from '@/utils/fingerprint-validators';
import type { Ja4FingerprintType, BotRuleAction } from '@/services/bot-manager.service';

interface BotProfileManageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
}

export function BotProfileManageDialog({ open, onOpenChange, profileId }: BotProfileManageDialogProps) {
  const [selectedDomainId, setSelectedDomainId] = useState('');
  const [ruleName, setRuleName] = useState('');
  const [fingerprintType, setFingerprintType] = useState<Ja4FingerprintType>('ja4h');
  const [fingerprintsText, setFingerprintsText] = useState('');
  const [ruleAction, setRuleAction] = useState<BotRuleAction>('deny');
  const [settingsName, setSettingsName] = useState('');
  const [settingsDescription, setSettingsDescription] = useState('');
  const [settingsPolicy, setSettingsPolicy] = useState<'blacklist' | 'whitelist'>('blacklist');

  const { data: profile, isLoading, refetch } = useQuery({
    ...botProfileQueryOptions(profileId),
    enabled: open && !!profileId,
  });

  const { data: domainsData } = useQuery({
    ...domainQueryOptions.all({ limit: 200, status: 'active' }),
    enabled: open,
  });

  const updateProfile = useUpdateBotProfile();
  const createRule = useCreateBotRule();
  const deleteRule = useDeleteBotRule();
  const toggleRule = useToggleBotRule();
  const assignDomain = useAssignBotProfileDomain();
  const removeDomain = useRemoveBotProfileDomain();
  const applyRules = useApplyBotRules();

  useEffect(() => {
    if (profile && open) {
      setSettingsName(profile.name);
      setSettingsDescription(profile.description || '');
      setSettingsPolicy(profile.policyMode);
    }
  }, [profile, open]);

  useEffect(() => {
    if (!open) {
      setSelectedDomainId('');
      setRuleName('');
      setFingerprintsText('');
    }
  }, [open]);

  const assignedDomainIds = new Set(profile?.domains?.map((d) => d.domainId) ?? []);
  const availableDomains =
    domainsData?.data.filter((d) => !assignedDomainIds.has(d.id)) ?? [];

  const handleSaveSettings = async () => {
    if (!profile) return;
    try {
      await updateProfile.mutateAsync({
        id: profile.id,
        data: {
          name: settingsName,
          description: settingsDescription || undefined,
          policyMode: settingsPolicy,
        },
      });
      toast.success('Profile updated');
      refetch();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleAddRules = async () => {
    if (!profile) return;
    if (!ruleName.trim()) {
      toast.error('Rule name is required');
      return;
    }

    const lines = parseFingerprintLines(fingerprintsText);
    const validationError = validateFingerprintLines(fingerprintType, lines);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      for (let i = 0; i < lines.length; i++) {
        const suffix = lines.length > 1 ? ` #${i + 1}` : '';
        await createRule.mutateAsync({
          profileId: profile.id,
          data: {
            name: `${ruleName.trim()}${suffix}`,
            fingerprintType,
            fingerprint: lines[i],
            action: ruleAction,
            enabled: true,
            priority: 100,
          },
        });
      }
      setRuleName('');
      setFingerprintsText('');
      toast.success(`${lines.length} rule(s) added`);
      refetch();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to create rules');
    }
  };

  const handleAssignDomain = async () => {
    if (!profile || !selectedDomainId) return;
    try {
      await assignDomain.mutateAsync({ profileId: profile.id, domainId: selectedDomainId });
      setSelectedDomainId('');
      toast.success('Domain assigned');
      refetch();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to assign domain');
    }
  };

  const handleRemoveDomain = async (domainId: string, domainName: string) => {
    if (!profile) return;
    if (!confirm(`Remove "${domainName}" from this profile?`)) return;
    try {
      await removeDomain.mutateAsync({ profileId: profile.id, domainId });
      toast.success('Domain removed');
      refetch();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to remove domain');
    }
  };

  const handleApply = async () => {
    try {
      const result = await applyRules.mutateAsync();
      if (result.success) {
        toast.success(result.message || 'Bot Manager rules applied successfully');
        onOpenChange(false);
      } else {
        toast.error(result.message || 'Failed to apply bot rules');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err.response?.data?.message || err.message || 'Failed to apply bot rules');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Profile: {profile?.name ?? '…'}</DialogTitle>
        </DialogHeader>

        {isLoading || !profile ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading profile…</p>
        ) : (
          <Tabs defaultValue="domains">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="domains">
                Domains ({profile.domains?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="rules">
                Rules ({profile.rules?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="domains" className="space-y-4 mt-4">
              <Alert>
                <AlertDescription>
                  Domain must have <strong>Bot Manager enabled</strong> in Domain settings.
                  Profile rules apply only to assigned domains (in addition to global rules).
                </AlertDescription>
              </Alert>

              {profile.domains && profile.domains.length > 0 ? (
                <ul className="space-y-2">
                  {profile.domains.map((assignment) => (
                    <li
                      key={assignment.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="font-medium truncate">{assignment.domain.name}</span>
                        <Badge variant="outline">{assignment.domain.status}</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveDomain(assignment.domainId, assignment.domain.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No domains assigned yet.
                </p>
              )}

              <div className="flex gap-2">
                <Select value={selectedDomainId} onValueChange={setSelectedDomainId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select domain to assign…" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDomains.length === 0 ? (
                      <SelectItem value="__none" disabled>
                        No available domains
                      </SelectItem>
                    ) : (
                      availableDomains.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                          {!d.botManagerEnabled ? ' (Bot Manager off)' : ''}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAssignDomain}
                  disabled={!selectedDomainId || assignDomain.isPending}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Assign
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="rules" className="space-y-4 mt-4">
              {profile.rules && profile.rules.length > 0 ? (
                <ul className="space-y-2 max-h-48 overflow-y-auto">
                  {profile.rules.map((rule) => (
                    <li
                      key={rule.id}
                      className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{rule.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {FINGERPRINT_TYPE_LABELS[rule.fingerprintType]}
                          </Badge>
                          <Badge
                            variant={rule.action === 'deny' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {rule.action}
                          </Badge>
                        </div>
                        <p
                          className="text-xs font-mono text-muted-foreground truncate mt-0.5"
                          title={rule.fingerprint}
                        >
                          {truncateFingerprint(rule.fingerprint, 40)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={() => toggleRule.mutateAsync(rule.id).then(() => refetch())}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (!confirm(`Delete rule "${rule.name}"?`)) return;
                            deleteRule.mutateAsync(rule.id).then(() => refetch());
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No rules yet. Add fingerprints below.
                </p>
              )}

              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-medium">Add rules (one fingerprint per line)</p>
                <div>
                  <Label>Rule name prefix</Label>
                  <Input
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    placeholder="Block Python requests"
                  />
                </div>
                <div>
                  <Label>Fingerprint type</Label>
                  <Select
                    value={fingerprintType}
                    onValueChange={(v) => setFingerprintType(v as Ja4FingerprintType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(FINGERPRINT_TYPE_LABELS) as Ja4FingerprintType[]).map((t) => (
                        <SelectItem key={t} value={t}>
                          {FINGERPRINT_TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fingerprints</Label>
                  <Textarea
                    value={fingerprintsText}
                    onChange={(e) => setFingerprintsText(e.target.value)}
                    rows={5}
                    className="font-mono text-xs"
                    placeholder={'ge11cn02_8f1234567890abcdef1234567890abcdef\nge11cn02_8f2345678901bcdef2345678901bcdef'}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Paste multiple fingerprints — one per line. Each line becomes a separate rule.
                  </p>
                </div>
                <div>
                  <Label>Action</Label>
                  <Select value={ruleAction} onValueChange={(v) => setRuleAction(v as BotRuleAction)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="allow">Allow</SelectItem>
                      <SelectItem value="deny">Deny</SelectItem>
                      <SelectItem value="log_only">Log only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddRules} disabled={createRule.isPending}>
                  Add Rules
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              <div>
                <Label>Profile name</Label>
                <Input value={settingsName} onChange={(e) => setSettingsName(e.target.value)} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={settingsDescription}
                  onChange={(e) => setSettingsDescription(e.target.value)}
                  rows={2}
                />
              </div>
              <div>
                <Label>Policy mode</Label>
                <Select
                  value={settingsPolicy}
                  onValueChange={(v) => setSettingsPolicy(v as 'blacklist' | 'whitelist')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blacklist">Blacklist — block listed fingerprints only</SelectItem>
                    <SelectItem value="whitelist">Whitelist — allow listed, deny all others</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSaveSettings} disabled={updateProfile.isPending}>
                Save settings
              </Button>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleApply} disabled={applyRules.isPending}>
            <RefreshCw className={`h-4 w-4 mr-2 ${applyRules.isPending ? 'animate-spin' : ''}`} />
            {applyRules.isPending ? 'Applying…' : 'Apply Rules to Nginx'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
