import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Server, Link as LinkIcon } from "lucide-react";
import { SystemConfig, SlaveNodes } from '@/components/pages/SlaveNodes'
import { createFileRoute } from '@tanstack/react-router'
import { systemConfigQueryOptions } from "@/queries/system-config.query-options";

export const Route = createFileRoute('/_auth/nodes')({
  component: RouteComponent,
})

function RouteComponent() {
  // Fetch system configuration
  const { data: systemConfigData, isLoading: isConfigLoading } = useQuery(systemConfigQueryOptions.all);
  const systemConfig = systemConfigData?.data;

  const currentMode = systemConfig?.nodeMode || 'master';
  const isMasterMode = currentMode === 'master';

  return (
    <div className="space-y-6">
      <SystemConfig
        systemConfig={systemConfig}
        isLoading={isConfigLoading}
        onModeChange={() => {}} // This will be handled internally by SystemConfig
      />
      
      {!isConfigLoading && isMasterMode && (
        <div className="space-y-4">
          <Tabs value={currentMode} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="master" className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                Master Mode
              </TabsTrigger>
              <TabsTrigger value="slave" className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Slave Mode
              </TabsTrigger>
            </TabsList>

            {/* MASTER MODE TAB */}
            <TabsContent value="master" className="space-y-4">
              <SlaveNodes systemConfig={systemConfig} />
            </TabsContent>

            {/* SLAVE MODE TAB */}
            <TabsContent value="slave" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                Switch to Slave Mode to manage slave node connections.
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}