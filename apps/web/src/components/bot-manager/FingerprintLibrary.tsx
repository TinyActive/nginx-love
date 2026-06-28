import { useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { fingerprintLibraryQueryOptions, useCreateBotRule } from '@/queries/bot-manager.query-options';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FINGERPRINT_TYPE_LABELS, truncateFingerprint } from '@/utils/fingerprint-validators';

export function FingerprintLibrary() {
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  const { data: fingerprints } = useSuspenseQuery(
    fingerprintLibraryQueryOptions({ isBuiltin: true, search: search || undefined })
  );
  const createRule = useCreateBotRule();

  const handleBlock = async (fp: typeof fingerprints[0]) => {
    try {
      await createRule.mutateAsync({
        isGlobal: true,
        data: {
          name: `Block ${fp.clientLabel || fp.name}`,
          fingerprintType: fp.fingerprintType,
          fingerprint: fp.fingerprint,
          action: 'deny',
          enabled: true,
          priority: 100,
          clientLabel: fp.clientLabel || undefined,
        },
      });
      toast({ title: 'Added to global block list' });
    } catch {
      toast({ title: 'Error', description: 'Failed to create rule', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search fingerprints..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {fingerprints.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No built-in fingerprints in library. Run seed or add rules manually.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {fingerprints.map((fp) => (
            <Card key={fp.id}>
              <CardContent className="py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{fp.name}</span>
                    <Badge variant="outline">{FINGERPRINT_TYPE_LABELS[fp.fingerprintType]}</Badge>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground mt-1" title={fp.fingerprint}>
                    {truncateFingerprint(fp.fingerprint, 56)}
                  </p>
                  {fp.clientLabel && <p className="text-xs">{fp.clientLabel}</p>}
                  {fp.notes && <p className="text-xs text-muted-foreground">{fp.notes}</p>}
                </div>
                <Button size="sm" variant="destructive" onClick={() => handleBlock(fp)}>
                  Block Globally
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
