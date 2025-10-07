import { CRSRuleDefinition } from '../modsec.types';

/**
 * OWASP CRS Rule Mapping
 * Maps attack types to actual CRS rule files
 */
export class CRSRulesService {
  /**
   * 10 CRS Rules matching requirements
   */
  private readonly CRS_RULES: CRSRuleDefinition[] = [
    {
      ruleFile: 'REQUEST-942-APPLICATION-ATTACK-SQLI.conf',
      name: 'SQL Injection Protection',
      category: 'SQLi',
      description: 'Detects SQL injection attempts using OWASP CRS detection rules',
      ruleIdRange: '942100-942999',
      paranoia: 1
    },
    {
      ruleFile: 'REQUEST-941-APPLICATION-ATTACK-XSS.conf',
      name: 'XSS Attack Prevention',
      category: 'XSS',
      description: 'Blocks cross-site scripting attacks',
      ruleIdRange: '941100-941999',
      paranoia: 1
    },
    {
      ruleFile: 'REQUEST-932-APPLICATION-ATTACK-RCE.conf',
      name: 'RCE Detection',
      category: 'RCE',
      description: 'Remote code execution prevention',
      ruleIdRange: '932100-932999',
      paranoia: 1
    },
    {
      ruleFile: 'REQUEST-930-APPLICATION-ATTACK-LFI.conf',
      name: 'LFI Protection',
      category: 'LFI',
      description: 'Local file inclusion prevention',
      ruleIdRange: '930100-930999',
      paranoia: 1
    },
    {
      ruleFile: 'REQUEST-943-APPLICATION-ATTACK-SESSION-FIXATION.conf',
      name: 'Session Fixation',
      category: 'SESSION-FIXATION',
      description: 'Prevents session fixation attacks',
      ruleIdRange: '943100-943999',
      paranoia: 1
    },
    {
      ruleFile: 'REQUEST-933-APPLICATION-ATTACK-PHP.conf',
      name: 'PHP Attacks',
      category: 'PHP',
      description: 'PHP-specific attack prevention',
      ruleIdRange: '933100-933999',
      paranoia: 1
    },
    {
      ruleFile: 'REQUEST-920-PROTOCOL-ENFORCEMENT.conf',
      name: 'Protocol Attacks',
      category: 'PROTOCOL-ATTACK',
      description: 'HTTP protocol attack prevention',
      ruleIdRange: '920100-920999',
      paranoia: 1
    },
    {
      ruleFile: 'RESPONSE-950-DATA-LEAKAGES.conf',
      name: 'Data Leakage',
      category: 'DATA-LEAKAGES',
      description: 'Prevents sensitive data leakage',
      ruleIdRange: '950100-950999',
      paranoia: 1
    },
    {
      ruleFile: 'REQUEST-934-APPLICATION-ATTACK-GENERIC.conf',
      name: 'SSRF Protection',
      category: 'SSRF',
      description: 'Server-side request forgery prevention (part of generic attacks)',
      ruleIdRange: '934100-934999',
      paranoia: 1
    },
    {
      ruleFile: 'RESPONSE-955-WEB-SHELLS.conf',
      name: 'Web Shell Detection',
      category: 'WEB-SHELL',
      description: 'Detects web shell uploads',
      ruleIdRange: '955100-955999',
      paranoia: 1
    }
  ];

  /**
   * Get all CRS rules
   */
  getAllRules(): CRSRuleDefinition[] {
    return [...this.CRS_RULES];
  }

  /**
   * Get CRS rule by category
   */
  getRuleByCategory(category: string): CRSRuleDefinition | undefined {
    return this.CRS_RULES.find(rule => rule.category === category);
  }

  /**
   * Get CRS rule by file name
   */
  getRuleByFile(ruleFile: string): CRSRuleDefinition | undefined {
    return this.CRS_RULES.find(rule => rule.ruleFile === ruleFile);
  }
}

export const crsRulesService = new CRSRulesService();
