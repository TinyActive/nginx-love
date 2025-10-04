import { useState } from 'react';
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
import { toast } from 'sonner';
import { useAddModSecRule } from '@/queries/modsec.query-options';

interface CustomRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomRuleDialog({ open, onOpenChange }: CustomRuleDialogProps) {
  const addCustomRuleMutation = useAddModSecRule();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [ruleContent, setRuleContent] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !category.trim() || !ruleContent.trim()) {
      toast.error('Name, category and rule content are required');
      return;
    }

    try {
      await addCustomRuleMutation.mutateAsync({
        name: name.trim(),
        category: category.trim(),
        ruleContent: ruleContent.trim(),
        description: description.trim() || undefined,
        enabled: true,
      });

      toast.success('Custom rule added successfully');
      onOpenChange(false);
      
      // Reset form
      setName('');
      setCategory('');
      setRuleContent('');
      setDescription('');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to add custom rule');
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
          <DialogTitle>Add Custom ModSecurity Rule</DialogTitle>
          <DialogDescription>
            Write custom ModSecurity rules using SecRule directives
          </DialogDescription>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={addCustomRuleMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={addCustomRuleMutation.isPending}>
              {addCustomRuleMutation.isPending ? 'Adding...' : 'Add Rule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
