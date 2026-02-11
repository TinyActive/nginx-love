import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Search,
  Plus,
  Trash2,
  Edit,
  TestTube,
  Shield,
  Cloud,
  Globe,
  RefreshCw,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import {
  useUnifiedDnsRecords,
  useAdGuardRewrites,
  useCloudflareRecords,
  useTestDnsConnection,
  useAddAdGuardRewrite,
  useUpdateAdGuardRewrite,
  useDeleteAdGuardRewrite,
  useCreateCloudflareRecord,
  useUpdateCloudflareRecord,
  useDeleteCloudflareRecord,
} from '@/queries/dns.query-options';
import type {
  AdGuardConfig,
  CloudflareConfig,
  CloudflareDNSRecord,
  DnsProviderConfig,
  UnifiedDnsRecord,
  AdGuardRewrite,
} from '@/services/dns.service';

// ============ Provider Config Storage (localStorage) ============

const STORAGE_KEY = 'dns-provider-configs';

function loadConfigs(): DnsProviderConfig[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveConfigs(configs: DnsProviderConfig[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
}

// ============ Main Component ============

export default function DNSManagement() {
  const { t } = useTranslation();
  const [configs, setConfigs] = useState<DnsProviderConfig[]>(loadConfigs);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showAddRecordDialog, setShowAddRecordDialog] = useState(false);
  const [showEditRecordDialog, setShowEditRecordDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState<UnifiedDnsRecord | null>(null);
  const [addRecordProvider, setAddRecordProvider] = useState<'adguard' | 'cloudflare'>('adguard');

  // Configs for each provider
  const adguardConfig = useMemo(
    () => configs.find((c) => c.provider === 'adguard' && c.enabled)?.adguard ?? null,
    [configs]
  );
  const cloudflareConfig = useMemo(
    () => configs.find((c) => c.provider === 'cloudflare' && c.enabled)?.cloudflare ?? null,
    [configs]
  );

  // Queries
  const unifiedQuery = useUnifiedDnsRecords(configs.filter((c) => c.enabled));
  const adguardQuery = useAdGuardRewrites(adguardConfig);
  const cloudflareQuery = useCloudflareRecords(cloudflareConfig);

  // Mutations
  const testConnection = useTestDnsConnection();
  const addAdGuardRewrite = useAddAdGuardRewrite();
  const updateAdGuardRewrite = useUpdateAdGuardRewrite();
  const deleteAdGuardRewrite = useDeleteAdGuardRewrite();
  const createCloudflareRecord = useCreateCloudflareRecord();
  const updateCloudflareRecord = useUpdateCloudflareRecord();
  const deleteCloudflareRecord = useDeleteCloudflareRecord();

  // Filter records based on search
  const filteredRecords = useMemo(() => {
    const records = unifiedQuery.data ?? [];
    if (!searchQuery) return records;
    const q = searchQuery.toLowerCase();
    return records.filter(
      (r) =>
        r.domain.toLowerCase().includes(q) ||
        r.value.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.provider.toLowerCase().includes(q)
    );
  }, [unifiedQuery.data, searchQuery]);

  const updateConfigs = (newConfigs: DnsProviderConfig[]) => {
    setConfigs(newConfigs);
    saveConfigs(newConfigs);
  };

  const handleTestConnection = (config: DnsProviderConfig) => {
    testConnection.mutate(config);
  };

  // Provider badge color
  const providerBadge = (provider: string) => {
    switch (provider) {
      case 'adguard':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Shield className="h-3 w-3 mr-1" />
            AdGuard
          </Badge>
        );
      case 'cloudflare':
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            <Cloud className="h-3 w-3 mr-1" />
            Cloudflare
          </Badge>
        );
      default:
        return <Badge variant="outline">{provider}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('dns.title', 'DNS Management')}
          </h1>
          <p className="text-muted-foreground">
            {t('dns.description', 'Manage DNS records across AdGuardHome and Cloudflare')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowConfigDialog(true)}>
            <Settings className="h-4 w-4 mr-2" />
            {t('dns.configure', 'Configure Providers')}
          </Button>
          <Button onClick={() => setShowAddRecordDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('dns.addRecord', 'Add Record')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dns.totalRecords', 'Total Records')}
            </CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unifiedQuery.data?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dns.adguardRecords', 'AdGuard Records')}
            </CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {unifiedQuery.data?.filter((r) => r.provider === 'adguard').length ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dns.cloudflareRecords', 'Cloudflare Records')}
            </CardTitle>
            <Cloud className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {unifiedQuery.data?.filter((r) => r.provider === 'cloudflare').length ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dns.providers', 'Active Providers')}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{configs.filter((c) => c.enabled).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <Globe className="h-4 w-4 mr-2" />
            {t('dns.overview', 'All Records')}
          </TabsTrigger>
          <TabsTrigger value="adguard">
            <Shield className="h-4 w-4 mr-2" />
            AdGuardHome
          </TabsTrigger>
          <TabsTrigger value="cloudflare">
            <Cloud className="h-4 w-4 mr-2" />
            Cloudflare
          </TabsTrigger>
        </TabsList>

        {/* Search Bar */}
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('dns.search', 'Search DNS records...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              unifiedQuery.refetch();
              adguardQuery.refetch();
              cloudflareQuery.refetch();
            }}
          >
            <RefreshCw className={`h-4 w-4 ${unifiedQuery.isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Overview Tab - All Records */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>{t('dns.allRecords', 'All DNS Records')}</CardTitle>
              <CardDescription>
                {t('dns.allRecordsDesc', 'Aggregated DNS records from all configured providers')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {unifiedQuery.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>{t('common.loading', 'Loading...')}</span>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {configs.filter((c) => c.enabled).length === 0
                    ? t('dns.noProviders', 'No providers configured. Click "Configure Providers" to get started.')
                    : t('dns.noRecords', 'No DNS records found')}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('dns.provider', 'Provider')}</TableHead>
                      <TableHead>{t('dns.domain', 'Domain')}</TableHead>
                      <TableHead>{t('dns.type', 'Type')}</TableHead>
                      <TableHead>{t('dns.value', 'Value')}</TableHead>
                      <TableHead>{t('dns.ttl', 'TTL')}</TableHead>
                      <TableHead>{t('dns.proxied', 'Proxied')}</TableHead>
                      <TableHead className="text-right">{t('dns.actions', 'Actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{providerBadge(record.provider)}</TableCell>
                        <TableCell className="font-medium">{record.domain}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{record.type}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{record.value}</TableCell>
                        <TableCell>{record.ttl ?? '-'}</TableCell>
                        <TableCell>
                          {record.proxied !== undefined ? (
                            record.proxied ? (
                              <Badge variant="default" className="bg-orange-500">On</Badge>
                            ) : (
                              <Badge variant="outline">Off</Badge>
                            )
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingRecord(record);
                                setShowEditRecordDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteRecord(record)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AdGuard Tab */}
        <TabsContent value="adguard">
          <AdGuardTab
            config={adguardConfig}
            query={adguardQuery}
            searchQuery={searchQuery}
            onAdd={(rewrite) => {
              if (adguardConfig) {
                addAdGuardRewrite.mutate({ config: adguardConfig, rewrite });
              }
            }}
            onUpdate={(oldRewrite, newRewrite) => {
              if (adguardConfig) {
                updateAdGuardRewrite.mutate({ config: adguardConfig, oldRewrite, newRewrite });
              }
            }}
            onDelete={(rewrite) => {
              if (adguardConfig) {
                deleteAdGuardRewrite.mutate({ config: adguardConfig, rewrite });
              }
            }}
          />
        </TabsContent>

        {/* Cloudflare Tab */}
        <TabsContent value="cloudflare">
          <CloudflareTab
            config={cloudflareConfig}
            query={cloudflareQuery}
            searchQuery={searchQuery}
            onCreate={(record) => {
              if (cloudflareConfig) {
                createCloudflareRecord.mutate({ config: cloudflareConfig, record });
              }
            }}
            onUpdate={(recordId, record) => {
              if (cloudflareConfig) {
                updateCloudflareRecord.mutate({ config: cloudflareConfig, recordId, record });
              }
            }}
            onDelete={(recordId) => {
              if (cloudflareConfig) {
                deleteCloudflareRecord.mutate({ config: cloudflareConfig, recordId });
              }
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Provider Config Dialog */}
      <ProviderConfigDialog
        open={showConfigDialog}
        onOpenChange={setShowConfigDialog}
        configs={configs}
        onSave={updateConfigs}
        onTest={handleTestConnection}
        testResult={testConnection}
      />

      {/* Add Record Dialog */}
      <AddRecordDialog
        open={showAddRecordDialog}
        onOpenChange={setShowAddRecordDialog}
        provider={addRecordProvider}
        onProviderChange={setAddRecordProvider}
        adguardConfig={adguardConfig}
        cloudflareConfig={cloudflareConfig}
        onAddAdGuard={(rewrite) => {
          if (adguardConfig) {
            addAdGuardRewrite.mutate(
              { config: adguardConfig, rewrite },
              { onSuccess: () => setShowAddRecordDialog(false) }
            );
          }
        }}
        onAddCloudflare={(record) => {
          if (cloudflareConfig) {
            createCloudflareRecord.mutate(
              { config: cloudflareConfig, record },
              { onSuccess: () => setShowAddRecordDialog(false) }
            );
          }
        }}
      />

      {/* Edit Record Dialog */}
      <EditRecordDialog
        open={showEditRecordDialog}
        onOpenChange={setShowEditRecordDialog}
        record={editingRecord}
        adguardConfig={adguardConfig}
        cloudflareConfig={cloudflareConfig}
        onUpdateAdGuard={(oldRewrite, newRewrite) => {
          if (adguardConfig) {
            updateAdGuardRewrite.mutate(
              { config: adguardConfig, oldRewrite, newRewrite },
              { onSuccess: () => setShowEditRecordDialog(false) }
            );
          }
        }}
        onUpdateCloudflare={(recordId, record) => {
          if (cloudflareConfig) {
            updateCloudflareRecord.mutate(
              { config: cloudflareConfig, recordId, record },
              { onSuccess: () => setShowEditRecordDialog(false) }
            );
          }
        }}
      />
    </div>
  );

  function handleDeleteRecord(record: UnifiedDnsRecord) {
    if (record.provider === 'adguard' && adguardConfig) {
      deleteAdGuardRewrite.mutate({
        config: adguardConfig,
        rewrite: { domain: record.domain, answer: record.value },
      });
    } else if (record.provider === 'cloudflare' && cloudflareConfig) {
      const cfId = record.id.replace('cloudflare-', '');
      deleteCloudflareRecord.mutate({ config: cloudflareConfig, recordId: cfId });
    }
  }
}

// ============ Settings Icon (imported inline to avoid adding to sidebar imports) ============
function Settings(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// ============ AdGuard Tab Component ============

function AdGuardTab({
  config,
  query,
  searchQuery,
  onAdd,
  onUpdate,
  onDelete,
}: {
  config: AdGuardConfig | null;
  query: { data?: AdGuardRewrite[]; isLoading: boolean; isFetching: boolean; refetch: () => void };
  searchQuery: string;
  onAdd: (rewrite: AdGuardRewrite) => void;
  onUpdate: (oldRewrite: AdGuardRewrite, newRewrite: AdGuardRewrite) => void;
  onDelete: (rewrite: AdGuardRewrite) => void;
}) {
  const { t } = useTranslation();
  const [showAdd, setShowAdd] = useState(false);
  const [editRewrite, setEditRewrite] = useState<AdGuardRewrite | null>(null);
  const [newDomain, setNewDomain] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  const rewrites: AdGuardRewrite[] = query.data ?? [];
  const filtered = searchQuery
    ? rewrites.filter(
        (r) =>
          r.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : rewrites;

  if (!config) {
    return (
      <Card>
        <CardContent className="text-center py-8 text-muted-foreground">
          {t('dns.adguardNotConfigured', 'AdGuardHome is not configured. Please configure it in Provider Settings.')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              {t('dns.adguardRewrites', 'AdGuardHome DNS Rewrites')}
            </CardTitle>
            <CardDescription>
              {t('dns.adguardRewritesDesc', 'Manage DNS rewrite rules for internal domains')}
            </CardDescription>
          </div>
          <Button onClick={() => { setShowAdd(true); setNewDomain(''); setNewAnswer(''); }}>
            <Plus className="h-4 w-4 mr-2" />
            {t('dns.addRewrite', 'Add Rewrite')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {query.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>{t('common.loading', 'Loading...')}</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('dns.noRewrites', 'No DNS rewrites found')}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('dns.domain', 'Domain')}</TableHead>
                <TableHead>{t('dns.answer', 'Answer')}</TableHead>
                <TableHead className="text-right">{t('dns.actions', 'Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((rewrite, index) => (
                <TableRow key={`${rewrite.domain}-${rewrite.answer}-${index}`}>
                  <TableCell className="font-medium">{rewrite.domain}</TableCell>
                  <TableCell className="font-mono text-sm">{rewrite.answer}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditRewrite(rewrite);
                          setNewDomain(rewrite.domain);
                          setNewAnswer(rewrite.answer);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(rewrite)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Inline Add Dialog */}
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('dns.addRewrite', 'Add Rewrite')}</DialogTitle>
              <DialogDescription>{t('dns.addRewriteDesc', 'Add a new DNS rewrite rule')}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>{t('dns.domain', 'Domain')}</Label>
                <Input value={newDomain} onChange={(e) => setNewDomain(e.target.value)} placeholder="example.local" />
              </div>
              <div className="grid gap-2">
                <Label>{t('dns.answer', 'Answer')}</Label>
                <Input value={newAnswer} onChange={(e) => setNewAnswer(e.target.value)} placeholder="192.168.1.100" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>{t('common.cancel', 'Cancel')}</Button>
              <Button onClick={() => { onAdd({ domain: newDomain, answer: newAnswer }); setShowAdd(false); }}>
                {t('common.save', 'Save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Inline Edit Dialog */}
        <Dialog open={!!editRewrite} onOpenChange={(open) => !open && setEditRewrite(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('dns.editRewrite', 'Edit Rewrite')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>{t('dns.domain', 'Domain')}</Label>
                <Input value={newDomain} onChange={(e) => setNewDomain(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>{t('dns.answer', 'Answer')}</Label>
                <Input value={newAnswer} onChange={(e) => setNewAnswer(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditRewrite(null)}>{t('common.cancel', 'Cancel')}</Button>
              <Button onClick={() => {
                if (editRewrite) {
                  onUpdate(editRewrite, { domain: newDomain, answer: newAnswer });
                  setEditRewrite(null);
                }
              }}>
                {t('common.save', 'Save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// ============ Cloudflare Tab Component ============

function CloudflareTab({
  config,
  query,
  searchQuery,
  onCreate,
  onUpdate,
  onDelete,
}: {
  config: CloudflareConfig | null;
  query: { data?: CloudflareDNSRecord[]; isLoading: boolean; isFetching: boolean; refetch: () => void };
  searchQuery: string;
  onCreate: (record: { type: string; name: string; content: string; ttl?: number; proxied?: boolean; comment?: string }) => void;
  onUpdate: (recordId: string, record: { type?: string; name?: string; content?: string; ttl?: number; proxied?: boolean }) => void;
  onDelete: (recordId: string) => void;
}) {
  const { t } = useTranslation();
  const [showAdd, setShowAdd] = useState(false);
  const [editRecord, setEditRecord] = useState<CloudflareDNSRecord | null>(null);
  const [form, setForm] = useState({ type: 'A', name: '', content: '', ttl: 1, proxied: false, comment: '' });

  const records: CloudflareDNSRecord[] = query.data ?? [];
  const filtered = searchQuery
    ? records.filter(
        (r: CloudflareDNSRecord) =>
          r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.type?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : records;

  if (!config) {
    return (
      <Card>
        <CardContent className="text-center py-8 text-muted-foreground">
          {t('dns.cloudflareNotConfigured', 'Cloudflare is not configured. Please configure it in Provider Settings.')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-orange-600" />
              {t('dns.cloudflareRecords', 'Cloudflare DNS Records')}
            </CardTitle>
            <CardDescription>
              {t('dns.cloudflareRecordsDesc', 'Manage DNS records for public domains via Cloudflare')}
            </CardDescription>
          </div>
          <Button onClick={() => {
            setShowAdd(true);
            setForm({ type: 'A', name: '', content: '', ttl: 1, proxied: false, comment: '' });
          }}>
            <Plus className="h-4 w-4 mr-2" />
            {t('dns.addRecord', 'Add Record')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {query.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>{t('common.loading', 'Loading...')}</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('dns.noRecords', 'No DNS records found')}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('dns.type', 'Type')}</TableHead>
                <TableHead>{t('dns.name', 'Name')}</TableHead>
                <TableHead>{t('dns.content', 'Content')}</TableHead>
                <TableHead>{t('dns.ttl', 'TTL')}</TableHead>
                <TableHead>{t('dns.proxied', 'Proxied')}</TableHead>
                <TableHead className="text-right">{t('dns.actions', 'Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((record: CloudflareDNSRecord) => (
                <TableRow key={record.id}>
                  <TableCell><Badge variant="secondary">{record.type}</Badge></TableCell>
                  <TableCell className="font-medium">{record.name}</TableCell>
                  <TableCell className="font-mono text-sm max-w-[200px] truncate">{record.content}</TableCell>
                  <TableCell>{record.ttl === 1 ? 'Auto' : record.ttl}</TableCell>
                  <TableCell>
                    {record.proxied ? (
                      <Badge variant="default" className="bg-orange-500">On</Badge>
                    ) : (
                      <Badge variant="outline">Off</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => {
                        setEditRecord(record);
                        setForm({
                          type: record.type,
                          name: record.name,
                          content: record.content,
                          ttl: record.ttl,
                          proxied: record.proxied,
                          comment: record.comment || '',
                        });
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(record.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Add Record Dialog */}
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('dns.addRecord', 'Add Record')}</DialogTitle>
              <DialogDescription>{t('dns.addRecordDesc', 'Create a new Cloudflare DNS record')}</DialogDescription>
            </DialogHeader>
            <CloudflareRecordForm form={form} setForm={setForm} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>{t('common.cancel', 'Cancel')}</Button>
              <Button onClick={() => { onCreate(form); setShowAdd(false); }}>
                {t('common.save', 'Save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Record Dialog */}
        <Dialog open={!!editRecord} onOpenChange={(open) => !open && setEditRecord(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('dns.editRecord', 'Edit Record')}</DialogTitle>
            </DialogHeader>
            <CloudflareRecordForm form={form} setForm={setForm} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditRecord(null)}>{t('common.cancel', 'Cancel')}</Button>
              <Button onClick={() => {
                if (editRecord) {
                  onUpdate(editRecord.id, form);
                  setEditRecord(null);
                }
              }}>
                {t('common.save', 'Save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// ============ Cloudflare Record Form ============

interface CloudflareFormData {
  type: string;
  name: string;
  content: string;
  ttl: number;
  proxied: boolean;
  comment: string;
}

function CloudflareRecordForm({
  form,
  setForm,
}: {
  form: CloudflareFormData;
  setForm: (form: CloudflareFormData) => void;
}) {
  const { t } = useTranslation();
  const dnsTypes = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA', 'PTR'];

  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>{t('dns.type', 'Type')}</Label>
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dnsTypes.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>{t('dns.name', 'Name')}</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="subdomain.example.com" />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>{t('dns.content', 'Content')}</Label>
        <Input value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="IP address or target" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>{t('dns.ttl', 'TTL')}</Label>
          <Select value={String(form.ttl)} onValueChange={(v) => setForm({ ...form, ttl: Number(v) })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Auto</SelectItem>
              <SelectItem value="60">1 minute</SelectItem>
              <SelectItem value="300">5 minutes</SelectItem>
              <SelectItem value="600">10 minutes</SelectItem>
              <SelectItem value="1800">30 minutes</SelectItem>
              <SelectItem value="3600">1 hour</SelectItem>
              <SelectItem value="86400">1 day</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Switch checked={form.proxied} onCheckedChange={(v) => setForm({ ...form, proxied: v })} />
          <Label>{t('dns.proxied', 'Proxied')}</Label>
        </div>
      </div>
      <div className="grid gap-2">
        <Label>{t('dns.comment', 'Comment')}</Label>
        <Input value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} placeholder="Optional comment" />
      </div>
    </div>
  );
}

// ============ Provider Config Dialog ============

function ProviderConfigDialog({
  open,
  onOpenChange,
  configs,
  onSave,
  onTest,
  testResult,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configs: DnsProviderConfig[];
  onSave: (configs: DnsProviderConfig[]) => void;
  onTest: (config: DnsProviderConfig) => void;
  testResult: any;
}) {
  const { t } = useTranslation();
  const [localConfigs, setLocalConfigs] = useState<DnsProviderConfig[]>([]);
  const [testedProvider, setTestedProvider] = useState<string | null>(null);

  // Initialize local state when dialog opens via open prop
  useEffect(() => {
    if (open) {
      setLocalConfigs(
        configs.length > 0
          ? [...configs]
          : [
              { provider: 'adguard', enabled: false, adguard: { baseUrl: '', username: '', password: '' } },
              { provider: 'cloudflare', enabled: false, cloudflare: { apiToken: '', zoneId: '' } },
            ]
      );
      setTestedProvider(null);
    }
  }, [open, configs]);

  const updateConfig = (index: number, updates: Partial<DnsProviderConfig>) => {
    const updated = [...localConfigs];
    const current = updated[index]!;
    updated[index] = { ...current, ...updates, provider: updates.provider ?? current.provider, enabled: updates.enabled ?? current.enabled };
    setLocalConfigs(updated);
  };

  const handleTest = (cfg: DnsProviderConfig) => {
    setTestedProvider(cfg.provider);
    onTest(cfg);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('dns.configureProviders', 'Configure DNS Providers')}</DialogTitle>
          <DialogDescription>
            {t('dns.configureProvidersDesc', 'Set up AdGuardHome and Cloudflare integration to manage DNS records. Fill in the connection details and enable the providers you want to use.')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {localConfigs.map((cfg, index) => (
            <Card key={cfg.provider}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {cfg.provider === 'adguard' ? (
                      <Shield className="h-5 w-5 text-green-600" />
                    ) : (
                      <Cloud className="h-5 w-5 text-orange-600" />
                    )}
                    {cfg.provider === 'adguard' ? 'AdGuardHome' : 'Cloudflare'}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(cfg)}
                      disabled={testResult.isPending}
                    >
                      {testResult.isPending && testedProvider === cfg.provider ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <TestTube className="h-4 w-4 mr-1" />
                      )}
                      {t('dns.testConnection', 'Test')}
                    </Button>
                    <Switch
                      checked={cfg.enabled}
                      onCheckedChange={(v) => updateConfig(index, { enabled: v })}
                    />
                  </div>
                </div>
                <CardDescription>
                  {cfg.provider === 'adguard'
                    ? t('dns.adguardConfigDesc', 'Connect to your AdGuardHome instance to manage internal DNS rewrites')
                    : t('dns.cloudflareConfigDesc', 'Connect to Cloudflare to manage public DNS records for your zones')}
                </CardDescription>
                {/* Test connection result feedback */}
                {testedProvider === cfg.provider && !testResult.isPending && testResult.isSuccess && (
                  <div className="flex items-center gap-2 mt-2 text-sm">
                    {testResult.data?.connected ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {t('dns.connectionSuccess', 'Connected successfully')}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        {t('dns.connectionFailed', 'Connection failed')}
                      </Badge>
                    )}
                  </div>
                )}
                {testedProvider === cfg.provider && !testResult.isPending && testResult.isError && (
                  <div className="flex items-center gap-2 mt-2 text-sm">
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      {t('dns.connectionError', 'Connection error — check your credentials')}
                    </Badge>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {cfg.provider === 'adguard' && (
                  <>
                    <div className="grid gap-2">
                      <Label>Base URL</Label>
                      <Input
                        value={cfg.adguard?.baseUrl || ''}
                        onChange={(e) =>
                          updateConfig(index, { adguard: { ...cfg.adguard!, baseUrl: e.target.value } })
                        }
                        placeholder="http://192.168.1.1:3000"
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('dns.adguardBaseUrlHelp', 'The URL of your AdGuardHome web interface (e.g. http://192.168.1.1:3000)')}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>{t('dns.username', 'Username')}</Label>
                        <Input
                          value={cfg.adguard?.username || ''}
                          onChange={(e) =>
                            updateConfig(index, { adguard: { ...cfg.adguard!, username: e.target.value } })
                          }
                          placeholder="your-username"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>{t('dns.password', 'Password')}</Label>
                        <Input
                          type="password"
                          value={cfg.adguard?.password || ''}
                          onChange={(e) =>
                            updateConfig(index, { adguard: { ...cfg.adguard!, password: e.target.value } })
                          }
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </>
                )}
                {cfg.provider === 'cloudflare' && (
                  <>
                    <div className="grid gap-2">
                      <Label>API Token</Label>
                      <Input
                        type="password"
                        value={cfg.cloudflare?.apiToken || ''}
                        onChange={(e) =>
                          updateConfig(index, { cloudflare: { ...cfg.cloudflare!, apiToken: e.target.value } })
                        }
                        placeholder="Your Cloudflare API token"
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('dns.cloudflareTokenHelp', 'Create an API token at dash.cloudflare.com → My Profile → API Tokens with DNS edit permissions')}
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <Label>Zone ID</Label>
                      <Input
                        value={cfg.cloudflare?.zoneId || ''}
                        onChange={(e) =>
                          updateConfig(index, { cloudflare: { ...cfg.cloudflare!, zoneId: e.target.value } })
                        }
                        placeholder="e.g. 023e105f4ecef8ad9ca31a8372d0c353"
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('dns.cloudflareZoneHelp', 'Found on your domain overview page in Cloudflare dashboard → API section')}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button onClick={() => { onSave(localConfigs); onOpenChange(false); }}>
            {t('common.save', 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ Add Record Dialog ============

function AddRecordDialog({
  open,
  onOpenChange,
  provider,
  onProviderChange,
  adguardConfig,
  cloudflareConfig,
  onAddAdGuard,
  onAddCloudflare,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: 'adguard' | 'cloudflare';
  onProviderChange: (p: 'adguard' | 'cloudflare') => void;
  adguardConfig: AdGuardConfig | null;
  cloudflareConfig: CloudflareConfig | null;
  onAddAdGuard: (rewrite: AdGuardRewrite) => void;
  onAddCloudflare: (record: { type: string; name: string; content: string; ttl?: number; proxied?: boolean; comment?: string }) => void;
}) {
  const { t } = useTranslation();
  const [adguardForm, setAdguardForm] = useState({ domain: '', answer: '' });
  const [cfForm, setCfForm] = useState({ type: 'A', name: '', content: '', ttl: 1, proxied: false, comment: '' });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('dns.addRecord', 'Add DNS Record')}</DialogTitle>
          <DialogDescription>{t('dns.addRecordDesc', 'Select a provider and add a new DNS record')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label>{t('dns.provider', 'Provider')}</Label>
            <Select value={provider} onValueChange={(v) => onProviderChange(v as 'adguard' | 'cloudflare')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {adguardConfig && <SelectItem value="adguard">AdGuardHome</SelectItem>}
                {cloudflareConfig && <SelectItem value="cloudflare">Cloudflare</SelectItem>}
                {!adguardConfig && !cloudflareConfig && (
                  <SelectItem value="none" disabled>No providers configured</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {provider === 'adguard' && (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>{t('dns.domain', 'Domain')}</Label>
                <Input value={adguardForm.domain} onChange={(e) => setAdguardForm({ ...adguardForm, domain: e.target.value })} placeholder="example.local" />
              </div>
              <div className="grid gap-2">
                <Label>{t('dns.answer', 'Answer')}</Label>
                <Input value={adguardForm.answer} onChange={(e) => setAdguardForm({ ...adguardForm, answer: e.target.value })} placeholder="192.168.1.100" />
              </div>
            </div>
          )}

          {provider === 'cloudflare' && (
            <CloudflareRecordForm form={cfForm} setForm={setCfForm} />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button onClick={() => {
            if (provider === 'adguard') {
              onAddAdGuard(adguardForm);
            } else {
              onAddCloudflare(cfForm);
            }
          }}>
            {t('common.save', 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ Edit Record Dialog ============

function EditRecordDialog({
  open,
  onOpenChange,
  record,
  onUpdateAdGuard,
  onUpdateCloudflare,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: UnifiedDnsRecord | null;
  adguardConfig: AdGuardConfig | null;
  cloudflareConfig: CloudflareConfig | null;
  onUpdateAdGuard: (oldRewrite: AdGuardRewrite, newRewrite: AdGuardRewrite) => void;
  onUpdateCloudflare: (recordId: string, record: { type?: string; name?: string; content?: string; ttl?: number; proxied?: boolean }) => void;
}) {
  const { t } = useTranslation();
  const [adguardForm, setAdguardForm] = useState({ domain: '', answer: '' });
  const [cfForm, setCfForm] = useState({ type: 'A', name: '', content: '', ttl: 1, proxied: false, comment: '' });

  // Reset form when record changes
  useEffect(() => {
    if (record) {
      if (record.provider === 'adguard') {
        setAdguardForm({ domain: record.domain, answer: record.value });
      } else {
        setCfForm({
          type: record.type,
          name: record.domain,
          content: record.value,
          ttl: record.ttl ?? 1,
          proxied: record.proxied ?? false,
          comment: record.comment ?? '',
        });
      }
    }
  }, [record]);

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('dns.editRecord', 'Edit DNS Record')}</DialogTitle>
          <DialogDescription>
            {record.provider === 'adguard' ? 'AdGuardHome Rewrite' : 'Cloudflare Record'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {record.provider === 'adguard' && (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>{t('dns.domain', 'Domain')}</Label>
                <Input value={adguardForm.domain} onChange={(e) => setAdguardForm({ ...adguardForm, domain: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>{t('dns.answer', 'Answer')}</Label>
                <Input value={adguardForm.answer} onChange={(e) => setAdguardForm({ ...adguardForm, answer: e.target.value })} />
              </div>
            </div>
          )}

          {record.provider === 'cloudflare' && (
            <CloudflareRecordForm form={cfForm} setForm={setCfForm} />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button onClick={() => {
            if (record.provider === 'adguard') {
              onUpdateAdGuard(
                { domain: record.domain, answer: record.value },
                adguardForm
              );
            } else {
              const cfId = record.id.replace('cloudflare-', '');
              onUpdateCloudflare(cfId, cfForm);
            }
          }}>
            {t('common.save', 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
