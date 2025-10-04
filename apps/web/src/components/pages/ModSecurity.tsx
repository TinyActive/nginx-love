import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';
import { CustomRuleDialog } from '@/components/modsec/CustomRuleDialog';
import { toast } from 'sonner';

export default function ModSecurity() {
  const { t } = useTranslation();
  const { 
    crsRules,
    customRules,
    loadCRSRules,
    toggleCRSRule,
    loadCustomRules,
    toggleCustomRule,
    globalModSecEnabled, 
    loadGlobalModSecSettings,
    setGlobalModSec 
  } = useStore();
  const [customRuleDialogOpen, setCustomRuleDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadCRSRules(),
          loadCustomRules(),
          loadGlobalModSecSettings()
        ]);
      } catch (error) {
        console.error('Failed to load ModSecurity data:', error);
        toast.error('Failed to load ModSecurity data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [loadCRSRules, loadCustomRules, loadGlobalModSecSettings]);

  const handleGlobalToggle = async (enabled: boolean) => {
    try {
      await setGlobalModSec(enabled);
      toast.success(`ModSecurity globally ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update global ModSecurity setting');
    }
  };

  const handleCRSRuleToggle = async (ruleFile: string, name: string, currentState: boolean) => {
    try {
      await toggleCRSRule(ruleFile);
      toast.success(`Rule "${name}" ${!currentState ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to toggle rule');
    }
  };

  const handleCustomRuleToggle = async (id: string, name: string, currentState: boolean) => {
    try {
      await toggleCustomRule(id);
      toast.success(`Rule "${name}" ${!currentState ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to toggle rule');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('modsec.title')}</h1>
          <p className="text-muted-foreground">Configure OWASP ModSecurity Core Rule Set</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('modsec.global')}</CardTitle>
          <CardDescription>
            Enable or disable ModSecurity protection globally
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="global-modsec" className="text-base">
                ModSecurity Protection
              </Label>
              <p className="text-sm text-muted-foreground">
                {globalModSecEnabled
                  ? 'All domains with ModSecurity enabled are protected'
                  : 'ModSecurity is globally disabled'}
              </p>
            </div>
            <Switch
              id="global-modsec"
              checked={globalModSecEnabled}
              onCheckedChange={handleGlobalToggle}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ModSecurity Rules</CardTitle>
          <CardDescription>
            Manage OWASP CRS rules and custom rules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="crs" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="crs">CRS Rules (OWASP)</TabsTrigger>
              <TabsTrigger value="custom">Custom Rules</TabsTrigger>
            </TabsList>

            <TabsContent value="crs" className="mt-6">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Enable</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {crsRules.map((rule) => (
                      <TableRow key={rule.ruleFile}>
                        <TableCell className="font-medium">{rule.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{rule.category}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {rule.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                            {rule.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={() => handleCRSRuleToggle(rule.ruleFile, rule.name, rule.enabled)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="custom" className="mt-6">
              <div className="flex justify-end mb-4">
                <Button onClick={() => setCustomRuleDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Custom Rule
                </Button>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Enable</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customRules.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No custom rules. Click "Add Custom Rule" to create one.
                        </TableCell>
                      </TableRow>
                    ) : (
                      customRules.map((rule) => (
                        <TableRow key={rule.id}>
                          <TableCell className="font-medium">{rule.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{rule.category}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {rule.description}
                          </TableCell>
                          <TableCell>
                            <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                              {rule.enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Switch
                              checked={rule.enabled}
                              onCheckedChange={() => handleCustomRuleToggle(rule.id, rule.name, rule.enabled)}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <CustomRuleDialog
        open={customRuleDialogOpen}
        onOpenChange={setCustomRuleDialogOpen}
      />
    </div>
  );
}
