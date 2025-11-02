import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useAddModSecRule, useUpdateModSecRule } from '@/queries/modsec.query-options';
import type { ModSecurityCustomRule } from '@/types';

interface CustomRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editRule?: ModSecurityCustomRule | null;
}

export function CustomRuleDialog({ open, onOpenChange, editRule }: CustomRuleDialogProps) {
  const addCustomRuleMutation = useAddModSecRule();
  const updateCustomRuleMutation = useUpdateModSecRule();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [ruleContent, setRuleContent] = useState('');
  const [description, setDescription] = useState('');

  const isEditMode = !!editRule;

  // Load rule data when editing
  useEffect(() => {
    if (editRule) {
      setName(editRule.name);
      setCategory(editRule.category);
      setRuleContent(editRule.ruleContent || '');
      setDescription(editRule.description || '');
    } else {
      // Reset form when not editing
      setName('');
      setCategory('');
      setRuleContent('');
      setDescription('');
    }
  }, [editRule, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !category.trim() || !ruleContent.trim()) {
      toast.error('Name, category and rule content are required');
      return;
    }

    try {
      if (isEditMode && editRule) {
        // Update existing rule
        await updateCustomRuleMutation.mutateAsync({
          id: editRule.id,
          data: {
            name: name.trim(),
            category: category.trim(),
            ruleContent: ruleContent.trim(),
            description: description.trim() || undefined,
          },
        });
        toast.success('Custom rule updated successfully');
        // Only close dialog on success
        onOpenChange(false);
      } else {
        // Add new rule
        await addCustomRuleMutation.mutateAsync({
          name: name.trim(),
          category: category.trim(),
          ruleContent: ruleContent.trim(),
          description: description.trim() || undefined,
          enabled: true,
        });
        toast.success('Custom rule added successfully');
        // Only close dialog on success
        onOpenChange(false);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'add'} custom rule`;
      toast.error(errorMessage, {
        duration: 5000,
      });
      // Do not close dialog on error - keep form open for user to fix issues
    }
  };

  const exampleRule = `# Example ModSecurity Rule
SecRule REQUEST_FILENAME "@contains /admin" \\
  "id:1001,\\
  phase:1,\\
  deny,\\
  status:403,\\
  log,\\
  msg:'Admin access blocked'"`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit' : 'Add'} Custom ModSecurity Rule</DialogTitle>
          <DialogDescription>
            Write custom ModSecurity rules using SecRule directives
          </DialogDescription>
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-2">
              <ExternalLink className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Need to create whitelist rules?
                </p>
                <p className="text-blue-700 dark:text-blue-300 mb-2">
                  Use the ModSecurity Whitelist Generator to parse raw logs and generate whitelist rules automatically.
                </p>
                <a
                  href="https://whitelist.nginxwaf.me/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium underline"
                >
                  Open Whitelist Generator
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Rule Name</Label>
            <Input
              id="name"
              placeholder="e.g. Block Suspicious Activity"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              placeholder="e.g. CUSTOM, XSS, SQLi"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              placeholder="Brief description of the rule"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rule">Rule Content</Label>
            <Textarea
              id="rule"
              placeholder={exampleRule}
              value={ruleContent}
              onChange={(e) => setRuleContent(e.target.value)}
              rows={15}
              className="font-mono text-xs"
              required
            />
            <p className="text-xs text-muted-foreground">
              Use ModSecurity SecRule syntax. Multiple rules can be added at once.
            </p>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <p className="text-sm font-medium">Rule Guidelines:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Each rule must have a unique ID (id:XXXX)</li>
              <li>Use phase:1 for request headers, phase:2 for request body</li>
              <li>Actions: deny, drop, allow, pass, redirect, proxy</li>
              <li>Use 'log' to enable logging for the rule</li>
              <li>Test rules in staging before production</li>
            </ul>
          </div>

          <div className="rounded-lg bg-primary/10 border border-primary/20 p-4">
            <p className="text-sm font-medium mb-2">Example Rules:</p>
            <pre className="text-xs font-mono bg-background p-3 rounded overflow-x-auto">
{`# Block specific user agent
SecRule REQUEST_HEADERS:User-Agent "@contains badbot" \\
  "id:1002,phase:1,deny,status:403"

# Rate limiting
SecRule IP:DOS_COUNTER "@gt 100" \\
  "id:1003,phase:1,deny,status:429"

# Block SQL injection in GET params
SecRule ARGS "@detectSQLi" \\
  "id:1004,phase:2,deny,log,msg:'SQL Injection detected'"`}
            </pre>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={addCustomRuleMutation.isPending || updateCustomRuleMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={addCustomRuleMutation.isPending || updateCustomRuleMutation.isPending}
            >
              {isEditMode 
                ? (updateCustomRuleMutation.isPending ? 'Updating...' : 'Update Rule')
                : (addCustomRuleMutation.isPending ? 'Adding...' : 'Add Rule')
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
