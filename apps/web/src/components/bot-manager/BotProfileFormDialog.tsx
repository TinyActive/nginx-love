import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import { useToast } from '@/hooks/use-toast';
import { useCreateBotProfile, useUpdateBotProfile, useCreateBotRule } from '@/queries/bot-manager.query-options';
import { FINGERPRINT_TYPE_LABELS, parseFingerprintLines, validateFingerprintLines } from '@/utils/fingerprint-validators';
import type { BotProfile, BotPolicyMode, Ja4FingerprintType, BotRuleAction } from '@/services/bot-manager.service';

interface BotProfileFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile?: BotProfile | null;
}

interface FormData {
  name: string;
  description: string;
  policyMode: BotPolicyMode;
  ruleName: string;
  fingerprintType: Ja4FingerprintType;
  fingerprint: string;
  action: BotRuleAction;
}

export function BotProfileFormDialog({ open, onOpenChange, profile }: BotProfileFormDialogProps) {
  const { toast } = useToast();
  const createProfile = useCreateBotProfile();
  const updateProfile = useUpdateBotProfile();
  const createRule = useCreateBotRule();
  const isEdit = !!profile;

  const { register, handleSubmit, reset, setValue, watch } = useForm<FormData>({
    defaultValues: {
      name: '',
      description: '',
      policyMode: 'blacklist',
      ruleName: '',
      fingerprintType: 'ja4h',
      fingerprint: '',
      action: 'deny',
    },
  });

  useEffect(() => {
    if (!open) return;

    if (profile) {
      reset({
        name: profile.name,
        description: profile.description || '',
        policyMode: profile.policyMode,
        ruleName: '',
        fingerprintType: 'ja4h',
        fingerprint: '',
        action: 'deny',
      });
    } else {
      reset({
        name: '',
        description: '',
        policyMode: 'blacklist',
        ruleName: '',
        fingerprintType: 'ja4h',
        fingerprint: '',
        action: 'deny',
      });
    }
  }, [open, profile, reset]);

  const policyMode = watch('policyMode');
  const fingerprintType = watch('fingerprintType');
  const action = watch('action');

  const onSubmit = async (data: FormData) => {
    try {
      const fingerprintLines =
        data.ruleName && data.fingerprint ? parseFingerprintLines(data.fingerprint) : [];
      if (fingerprintLines.length > 0) {
        const validationError = validateFingerprintLines(data.fingerprintType, fingerprintLines);
        if (validationError) {
          toast({ title: 'Validation error', description: validationError, variant: 'destructive' });
          return;
        }
      }

      if (isEdit && profile) {
        await updateProfile.mutateAsync({
          id: profile.id,
          data: {
            name: data.name,
            description: data.description || undefined,
            policyMode: data.policyMode,
          },
        });
        for (let i = 0; i < fingerprintLines.length; i++) {
          const suffix = fingerprintLines.length > 1 ? ` #${i + 1}` : '';
          await createRule.mutateAsync({
            profileId: profile.id,
            data: {
              name: `${data.ruleName.trim()}${suffix}`,
              fingerprintType: data.fingerprintType,
              fingerprint: fingerprintLines[i],
              action: data.action,
              enabled: true,
              priority: 100,
            },
          });
        }
        toast({
          title: 'Profile updated',
          description:
            fingerprintLines.length > 0
              ? `${fingerprintLines.length} rule(s) added. Use Manage to assign domains.`
              : undefined,
        });
      } else {
        const created = await createProfile.mutateAsync({
          name: data.name,
          description: data.description || undefined,
          policyMode: data.policyMode,
        });
        for (let i = 0; i < fingerprintLines.length; i++) {
          const suffix = fingerprintLines.length > 1 ? ` #${i + 1}` : '';
          await createRule.mutateAsync({
            profileId: created.id,
            data: {
              name: `${data.ruleName.trim()}${suffix}`,
              fingerprintType: data.fingerprintType,
              fingerprint: fingerprintLines[i],
              action: data.action,
              enabled: true,
              priority: 100,
            },
          });
        }
        toast({
          title: 'Profile created',
          description: 'Open Manage to assign domains and add more rules.',
        });
      }
      onOpenChange(false);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to save profile',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Bot Profile' : 'Create Bot Profile'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs defaultValue="settings">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="rule">Add Rule</TabsTrigger>
            </TabsList>
            <TabsContent value="settings" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">Profile Name</Label>
                <Input id="name" {...register('name', { required: true })} placeholder="api-strict" />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" {...register('description')} rows={2} />
              </div>
              <div>
                <Label>Policy Mode</Label>
                <Select value={policyMode} onValueChange={(v) => setValue('policyMode', v as BotPolicyMode)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blacklist">Blacklist — block listed fingerprints only</SelectItem>
                    <SelectItem value="whitelist">Whitelist — allow listed, deny all others</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            <TabsContent value="rule" className="space-y-4 mt-4">
              <div>
                <Label>Rule Name</Label>
                <Input {...register('ruleName')} placeholder="Block Python requests" />
              </div>
              <div>
                <Label>Fingerprint Type</Label>
                <Select
                  value={fingerprintType}
                  onValueChange={(v) => setValue('fingerprintType', v as Ja4FingerprintType)}
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
                  {...register('fingerprint')}
                  rows={5}
                  className="font-mono text-xs"
                  placeholder={'One fingerprint per line:\nge11cn02_8f1234567890abcdef1234567890abcdef'}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional. Paste multiple fingerprints — one per line.
                </p>
              </div>
              <div>
                <Label>Action</Label>
                <Select value={action} onValueChange={(v) => setValue('action', v as BotRuleAction)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="allow">Allow</SelectItem>
                    <SelectItem value="deny">Deny</SelectItem>
                    <SelectItem value="log_only">Log only (discovery)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{isEdit ? 'Save' : 'Create'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
