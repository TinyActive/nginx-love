export interface AddCustomRuleDto {
  name: string;
  category: string;
  ruleContent: string;
  description?: string;
  domainId?: string;
  enabled?: boolean;
}
