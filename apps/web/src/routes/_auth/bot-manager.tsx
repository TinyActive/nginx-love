import { createFileRoute } from '@tanstack/react-router';
import { Suspense, useState } from 'react';
import { Bot, RefreshCw, Eye } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { botProfilesQueryOptions, useApplyBotRules } from '@/queries/bot-manager.query-options';
import { BotProfilesContent } from '@/components/bot-manager/BotProfilesContent';
import { BotGlobalRules } from '@/components/bot-manager/BotGlobalRules';
import { FingerprintLibrary } from '@/components/bot-manager/FingerprintLibrary';
import { BotAnalytics } from '@/components/bot-manager/BotAnalytics';
import { BotPreviewDialog } from '@/components/bot-manager/BotPreviewDialog';
import { botManagerService } from '@/services/bot-manager.service';

export const Route = createFileRoute('/_auth/bot-manager')({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(botProfilesQueryOptions({ limit: 100 })),
  component: BotManagerPage,
});

function BotManagerPage() {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewConfig, setPreviewConfig] = useState('');
  const applyMutation = useApplyBotRules();

  const handlePreview = async () => {
    try {
      const config = await botManagerService.previewConfig();
      setPreviewConfig(config);
      setPreviewOpen(true);
    } catch {
      toast.error('Failed to load preview');
    }
  };

  const handleApply = async () => {
    try {
      const result = await applyMutation.mutateAsync();
      if (result.success) {
        toast.success(result.message || 'Bot Manager rules applied successfully');
      } else {
        toast.error(result.message || 'Failed to apply bot rules');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err.response?.data?.message || err.message || 'Failed to apply bot rules');
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8" />
            Bot Manager
          </h1>
          <p className="text-muted-foreground mt-2">
            Allow and block traffic using JA4, JA4H, JA4S, JA4TCP, and JA4one fingerprints
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview Config
          </Button>
          <Button onClick={handleApply} disabled={applyMutation.isPending}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Apply Rules
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profiles">
        <TabsList>
          <TabsTrigger value="profiles">Profiles</TabsTrigger>
          <TabsTrigger value="global">Global Rules</TabsTrigger>
          <TabsTrigger value="library">Fingerprint Library</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="profiles" className="mt-6">
          <Suspense fallback={<TabSkeleton />}>
            <BotProfilesContent />
          </Suspense>
        </TabsContent>
        <TabsContent value="global" className="mt-6">
          <Suspense fallback={<TabSkeleton />}>
            <BotGlobalRules />
          </Suspense>
        </TabsContent>
        <TabsContent value="library" className="mt-6">
          <Suspense fallback={<TabSkeleton />}>
            <FingerprintLibrary />
          </Suspense>
        </TabsContent>
        <TabsContent value="analytics" className="mt-6">
          <Suspense fallback={<TabSkeleton />}>
            <BotAnalytics />
          </Suspense>
        </TabsContent>
      </Tabs>

      <BotPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        config={previewConfig}
        title="Bot Manager Nginx Config"
      />
    </div>
  );
}

function TabSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}
