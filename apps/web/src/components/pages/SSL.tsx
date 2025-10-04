import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Suspense } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SSLDialog } from '@/components/ssl/SSLDialog';
import { SSLStats } from './SSLStats';
import { SSLTable } from './SSLTable';
import { SkeletonStatsCard, SkeletonTable } from '@/components/ui/skeletons';
import { sslQueryKeys } from '@/queries/ssl.query-options';

export default function SSL() {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('nav.ssl')}</h1>
            <p className="text-muted-foreground">Manage SSL/TLS certificates</p>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Certificate
        </Button>
      </div>

      <SSLDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          // Invalidate SSL certificates list to refresh
          queryClient.invalidateQueries({ queryKey: sslQueryKeys.lists() });
        }}
      />

      {/* Fast-loading stats data - loaded immediately via route loader */}
      <Suspense fallback={
        <div className="grid gap-4 md:grid-cols-3">
          <SkeletonStatsCard />
          <SkeletonStatsCard />
          <SkeletonStatsCard />
        </div>
      }>
        <SSLStats />
      </Suspense>

      {/* Deferred SSL table data - loaded after initial render */}
      <Suspense fallback={
        <div className="rounded-md border">
          <SkeletonTable rows={5} columns={7} showCard={true} title="SSL Certificates" />
        </div>
      }>
        <SSLTable />
      </Suspense>
    </div>
  );
}
