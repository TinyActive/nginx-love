import { useSuspenseQuery } from '@tanstack/react-query';
import { botAnalyticsQueryOptions, useDiscoverFingerprints } from '@/queries/bot-manager.query-options';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FINGERPRINT_TYPE_LABELS, truncateFingerprint } from '@/utils/fingerprint-validators';

export function BotAnalytics() {
  const { toast } = useToast();
  const { data: analytics } = useSuspenseQuery(botAnalyticsQueryOptions({ limit: 20 }));
  const discover = useDiscoverFingerprints();

  const handleDiscover = async () => {
    try {
      const results = await discover.mutateAsync({ limit: 20 });
      toast({
        title: 'Discovery complete',
        description: `Found ${results.length} fingerprint(s) in logs`,
      });
    } catch {
      toast({ title: 'Error', description: 'Discovery failed', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Traffic analytics from JA4 fingerprint logs ({analytics.totalRequests} requests parsed).
        </p>
        <Button variant="outline" onClick={handleDiscover} disabled={discover.isPending}>
          Scan Logs
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics.totalRequests.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unique Fingerprints</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics.uniqueFingerprints.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">By Type</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {Object.entries(analytics.byType).map(([type, count]) => (
              <Badge key={type} variant="secondary">
                {type}: {count}
              </Badge>
            ))}
            {Object.keys(analytics.byType).length === 0 && (
              <span className="text-sm text-muted-foreground">No data yet</span>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Fingerprints</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.topFingerprints.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Enable Bot Manager on a domain and ensure JA4 logging is active to collect data.
            </p>
          ) : (
            <div className="space-y-2">
              {analytics.topFingerprints.map((fp, i) => (
                <div key={`${fp.fingerprintType}-${fp.fingerprint}`} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-6">#{i + 1}</span>
                      <Badge variant="outline">{FINGERPRINT_TYPE_LABELS[fp.fingerprintType]}</Badge>
                    </div>
                    <p className="text-xs font-mono ml-8 truncate" title={fp.fingerprint}>
                      {truncateFingerprint(fp.fingerprint, 48)}
                    </p>
                  </div>
                  <Badge>{fp.count} hits</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
