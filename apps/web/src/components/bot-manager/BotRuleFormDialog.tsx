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
import { useToast } from '@/hooks/use-toast';
import { useCreateBotRule } from '@/queries/bot-manager.query-options';
import { FINGERPRINT_TYPE_LABELS, parseFingerprintLines, validateFingerprintLines } from '@/utils/fingerprint-validators';
import type { Ja4FingerprintType, BotRuleAction } from '@/services/bot-manager.service';

interface BotRuleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId?: string;
  isGlobal?: boolean;
  initialFingerprint?: string;
  initialType?: Ja4FingerprintType;
}

interface FormData {
  name: string;
  fingerprintType: Ja4FingerprintType;
  fingerprint: string;
  action: BotRuleAction;
  clientLabel: string;
}

export function BotRuleFormDialog({
  open,
  onOpenChange,
  profileId,
  isGlobal,
  initialFingerprint,
  initialType,
}: BotRuleFormDialogProps) {
  const { toast } = useToast();
  const createRule = useCreateBotRule();

  const { register, handleSubmit, reset, setValue, watch } = useForm<FormData>({
    defaultValues: {
      name: '',
      fingerprintType: 'ja4tcp',
      fingerprint: '',
      action: 'deny',
      clientLabel: '',
    },
  });

  const fingerprintType = watch('fingerprintType');

  useEffect(() => {
    if (open) {
      reset({
        name: '',
        fingerprintType: initialType || 'ja4tcp',
        fingerprint: initialFingerprint || '',
        action: 'deny',
        clientLabel: '',
      });
    }
  }, [open, initialFingerprint, initialType, reset]);

  const onSubmit = async (data: FormData) => {
    const lines = parseFingerprintLines(data.fingerprint);
    const validationError = validateFingerprintLines(data.fingerprintType, lines);
    if (validationError) {
      toast({ title: 'Validation error', description: validationError, variant: 'destructive' });
      return;
    }

    try {
      for (let i = 0; i < lines.length; i++) {
        const suffix = lines.length > 1 ? ` #${i + 1}` : '';
        await createRule.mutateAsync({
          profileId,
          isGlobal,
          data: {
            name: `${data.name.trim()}${suffix}`,
            fingerprintType: data.fingerprintType,
            fingerprint: lines[i],
            action: data.action,
            enabled: true,
            priority: 100,
            clientLabel: data.clientLabel || undefined,
          },
        });
      }
      toast({ title: `${lines.length} rule(s) created` });
      onOpenChange(false);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to create rule',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isGlobal ? 'Add Global Rule' : 'Add Profile Rule'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Rule Name</Label>
            <Input {...register('name', { required: true })} placeholder="Block scanner" />
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
            <Textarea {...register('fingerprint', { required: true })} rows={5} className="font-mono text-xs" />
            <p className="text-xs text-muted-foreground mt-1">One fingerprint per line.</p>
          </div>
          <div>
            <Label>Client Label (optional)</Label>
            <Input {...register('clientLabel')} placeholder="curl, Chrome 120..." />
          </div>
          <div>
            <Label>Action</Label>
            <Select defaultValue="deny" onValueChange={(v) => setValue('action', v as BotRuleAction)}>
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Rule</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
