import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Server, Link as LinkIcon } from "lucide-react";
import { SystemConfig, SlaveNodes } from '@/components/pages/SlaveNodes'
import { createFileRoute } from '@tanstack/react-router'
import { systemConfigQueryOptions } from "@/queries/system-config.query-options";
import { systemConfigService } from "@/services/system-config.service";
import { useToast } from "@/hooks/use-toast";

export const Route = createFileRoute('/_auth/nodes')({
  component: RouteComponent,
})

function RouteComponent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch system configuration
  const { data: systemConfigData, isLoading: isConfigLoading } = useQuery(systemConfigQueryOptions.all);
  const systemConfig = systemConfigData?.data;

  const currentMode = systemConfig?.nodeMode || 'master';
  const isMasterMode = currentMode === 'master';

  // Update node mode mutation
  const updateNodeModeMutation = useMutation({
    mutationFn: systemConfigService.updateNodeMode,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] });
      
      toast({
        title: "Node mode changed",
        description: `Node is now in ${data.data.nodeMode} mode`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to change mode",
        description: error.response?.data?.message || "An error occurred",
        variant: "destructive"
      });
    }
  });

  // Handle tab change
  const handleTabChange = (newMode: string) => {
    if (newMode !== currentMode) {
      updateNodeModeMutation.mutate(newMode as 'master' | 'slave');
    }
  };


  return (
    <div className="space-y-6">
      <SystemConfig
        systemConfig={systemConfig}
        isLoading={isConfigLoading}
      />
      
      {!isConfigLoading && (
        <div className="space-y-4">
          <Tabs value={currentMode} onValueChange={handleTabChange} className="space-y-4">
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