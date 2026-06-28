import { useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { globalBotRulesQueryOptions, useToggleBotRule, useDeleteBotRule } from '@/queries/bot-manager.query-options';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { FINGERPRINT_TYPE_LABELS, truncateFingerprint } from '@/utils/fingerprint-validators';
import { BotRuleFormDialog } from './BotRuleFormDialog';
import type { BotRule } from '@/services/bot-manager.service';

export function BotGlobalRules() {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const { data: rules } = useSuspenseQuery(globalBotRulesQueryOptions());
  const toggleMutation = useToggleBotRule();
  const deleteMutation = useDeleteBotRule();

  const handleToggle = async (rule: BotRule) => {
    try {
      await toggleMutation.mutateAsync(rule.id);
    } catch {
      toast({ title: 'Error', description: 'Failed to toggle rule', variant: 'destructive' });
    }
  };

  const handleDelete = async (rule: BotRule) => {
    if (!confirm(`Delete rule "${rule.name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(rule.id);
      toast({ title: 'Deleted' });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete rule', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Global rules apply to all domains with Bot Manager enabled.
        </p>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Global Rule
        </Button>
      </div>

      {rules.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No global JA4 rules configured.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardContent className="py-4 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{rule.name}</span>
                    <Badge variant="outline">{FINGERPRINT_TYPE_LABELS[rule.fingerprintType]}</Badge>
                    <Badge variant={rule.action === 'deny' ? 'destructive' : rule.action === 'allow' ? 'default' : 'secondary'}>
                      {rule.action}
                    </Badge>
                    {rule.isBuiltin && <Badge variant="secondary">Built-in</Badge>}
                  </div>
                  <p className="text-xs font-mono text-muted-foreground mt-1 truncate" title={rule.fingerprint}>
                    {truncateFingerprint(rule.fingerprint, 48)}
                  </p>
                  {rule.clientLabel && (
                    <p className="text-xs text-muted-foreground">{rule.clientLabel}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch checked={rule.enabled} onCheckedChange={() => handleToggle(rule)} />
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(rule)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <BotRuleFormDialog open={createOpen} onOpenChange={setCreateOpen} isGlobal />
    </div>
  );
}
