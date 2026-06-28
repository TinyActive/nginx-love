import { useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Plus, Bot, Shield, ShieldOff, Settings2 } from 'lucide-react';
import { botProfilesQueryOptions, useToggleBotProfile, useDeleteBotProfile } from '@/queries/bot-manager.query-options';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { BotProfileFormDialog } from './BotProfileFormDialog';
import { BotProfileManageDialog } from './BotProfileManageDialog';
import type { BotProfile } from '@/services/bot-manager.service';

export function BotProfilesContent() {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editProfile, setEditProfile] = useState<BotProfile | null>(null);
  const [manageProfileId, setManageProfileId] = useState<string | null>(null);
  const { data } = useSuspenseQuery(botProfilesQueryOptions({ limit: 100 }));
  const toggleMutation = useToggleBotProfile();
  const deleteMutation = useDeleteBotProfile();

  const profiles = data.data;

  const handleToggle = async (profile: BotProfile, enabled: boolean) => {
    try {
      await toggleMutation.mutateAsync(profile.id);
      toast({ title: 'Success', description: `Profile ${enabled ? 'enabled' : 'disabled'}` });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to toggle profile',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (profile: BotProfile) => {
    if (!confirm(`Delete profile "${profile.name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(profile.id);
      toast({ title: 'Deleted', description: 'Bot profile removed' });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to delete',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Profile
        </Button>
      </div>

      {profiles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
            No bot profiles yet. Create one to manage JA4 fingerprint rules per domain.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {profiles.map((profile) => (
            <Card key={profile.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <Bot className="h-5 w-5" />
                  <CardTitle className="text-lg">{profile.name}</CardTitle>
                  <Badge variant={profile.policyMode === 'whitelist' ? 'destructive' : 'secondary'}>
                    {profile.policyMode === 'whitelist' ? (
                      <><Shield className="h-3 w-3 mr-1" /> Whitelist</>
                    ) : (
                      <><ShieldOff className="h-3 w-3 mr-1" /> Blacklist</>
                    )}
                  </Badge>
                  {!profile.enabled && <Badge variant="outline">Disabled</Badge>}
                </div>
                <Switch
                  checked={profile.enabled}
                  onCheckedChange={() => handleToggle(profile, !profile.enabled)}
                />
              </CardHeader>
              <CardContent>
                {profile.description && (
                  <p className="text-sm text-muted-foreground mb-3">{profile.description}</p>
                )}
                <div className="flex gap-4 text-sm text-muted-foreground mb-4">
                  <span>{profile._count?.rules ?? profile.rules?.length ?? 0} rules</span>
                  <span>{profile._count?.domains ?? profile.domains?.length ?? 0} domains</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="default" size="sm" onClick={() => setManageProfileId(profile.id)}>
                    <Settings2 className="h-4 w-4 mr-1" />
                    Manage
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEditProfile(profile)}>
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(profile)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <BotProfileFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      {editProfile && (
        <BotProfileFormDialog
          open={!!editProfile}
          onOpenChange={(open) => !open && setEditProfile(null)}
          profile={editProfile}
        />
      )}
      {manageProfileId && (
        <BotProfileManageDialog
          open={!!manageProfileId}
          onOpenChange={(open) => !open && setManageProfileId(null)}
          profileId={manageProfileId}
        />
      )}
    </div>
  );
}
