import * as fs from 'fs/promises';
import * as path from 'path';
import logger from '../../../utils/logger';

const MODSEC_MAIN_CONF = '/etc/nginx/modsec/main.conf';
const MODSEC_CRS_DISABLE_PATH = '/etc/nginx/modsec/crs_disabled';
const MODSEC_CRS_DISABLE_FILE = '/etc/nginx/modsec/crs_disabled.conf';

/**
 * ModSecurity setup service
 * Handles initialization and configuration of ModSecurity
 */
export class ModSecSetupService {
  /**
   * Initialize ModSecurity configuration for CRS rule management
   */
  async initializeModSecurityConfig(): Promise<void> {
    try {
      logger.info('🔧 Initializing ModSecurity configuration for CRS management...');

      // Step 1: Create crs_disabled directory
      try {
        await fs.mkdir(MODSEC_CRS_DISABLE_PATH, { recursive: true });
        await fs.chmod(MODSEC_CRS_DISABLE_PATH, 0o755);
        logger.info(`✓ CRS disable directory created: ${MODSEC_CRS_DISABLE_PATH}`);
      } catch (error: any) {
        if (error.code !== 'EEXIST') {
          throw error;
        }
        logger.info(`✓ CRS disable directory already exists: ${MODSEC_CRS_DISABLE_PATH}`);
      }

      // Step 3: Check if main.conf exists
      try {
        await fs.access(MODSEC_MAIN_CONF);
      } catch (error) {
        logger.warn(`ModSecurity main.conf not found at ${MODSEC_MAIN_CONF}`);
        logger.warn('CRS rule management will not work without ModSecurity installed');
        return;
      }

      // Step 4: Check and clean up main.conf
      let mainConfContent = await fs.readFile(MODSEC_MAIN_CONF, 'utf-8');
      const originalContent = mainConfContent;
      let needsCleanup = false;

      // Clean up old wildcard includes and duplicate comments
      const lines = mainConfContent.split('\n');
      const cleanedLines: string[] = [];
      let lastWasDisableComment = false;
      let skipNextEmptyLine = false;

      for (const line of lines) {
        // Skip old wildcard include
        if (line.includes('crs_disabled/*.conf')) {
          needsCleanup = true;
          skipNextEmptyLine = true;
          continue;
        }

        // Skip empty line after removed wildcard include
        if (skipNextEmptyLine && line.trim() === '') {
          skipNextEmptyLine = false;
          continue;
        }
        skipNextEmptyLine = false;

        // Skip duplicate disable comments
        if (line.trim() === '# CRS Rule Disables (managed by Nginx Love UI)') {
          if (lastWasDisableComment) {
            needsCleanup = true;
            continue;
          }
          lastWasDisableComment = true;
          cleanedLines.push(line);
          continue;
        }

        // Skip standalone empty lines between duplicate comments
        if (lastWasDisableComment && line.trim() === '') {
          const nextLineIndex = lines.indexOf(line) + 1;
          if (nextLineIndex < lines.length && lines[nextLineIndex].includes('# CRS Rule Disables')) {
            needsCleanup = true;
            continue;
          }
        }

        lastWasDisableComment = false;
        cleanedLines.push(line);
      }

      mainConfContent = cleanedLines.join('\n');

      // Always write if content changed
      if (needsCleanup || mainConfContent !== originalContent) {
        await fs.writeFile(MODSEC_MAIN_CONF, mainConfContent, 'utf-8');
        logger.info('✓ Cleaned up main.conf (removed duplicates and old wildcards)');
      }

      // Check if crs_disabled.conf include exists
      if (mainConfContent.includes('Include /etc/nginx/modsec/crs_disabled.conf')) {
        logger.info('✓ CRS disable include already configured in main.conf');
      } else {
        // Add include directive for CRS disable file (single file, not wildcard)
        const includeDirective = `\n# CRS Rule Disables (managed by Nginx Love UI)\nInclude /etc/nginx/modsec/crs_disabled.conf\n`;
        mainConfContent += includeDirective;

        await fs.writeFile(MODSEC_MAIN_CONF, mainConfContent, 'utf-8');
        logger.info('✓ Added CRS disable include to main.conf');
      }

      // Step 5: Create empty crs_disabled.conf if not exists
      try {
        await fs.access(MODSEC_CRS_DISABLE_FILE);
        logger.info('✓ CRS disable file already exists');
      } catch (error) {
        await fs.writeFile(MODSEC_CRS_DISABLE_FILE, '# CRS Disabled Rules\n# Managed by Nginx Love UI\n\n', 'utf-8');
        logger.info('✓ Created empty CRS disable file');
      }

      // Step 6: Create README in crs_disabled directory
      const readmeContent = `# ModSecurity CRS Disable Rules

This directory contains rule disable configurations managed by Nginx Love UI.

## How it works

When a CRS (Core Rule Set) rule is disabled via the UI:
1. A disable file is created: disable_REQUEST-XXX-*.conf
2. The file contains SecRuleRemoveById directives for that rule's ID range
3. ModSecurity loads these files and removes the specified rules

## File naming convention

- \`disable_REQUEST-942-APPLICATION-ATTACK-SQLI.conf\` - Disables SQL Injection rules
- \`disable_REQUEST-941-APPLICATION-ATTACK-XSS.conf\` - Disables XSS rules
- etc.

## Manual management

You can also manually create disable files here using this format:

\`\`\`
# Disable SQL Injection Protection
# Generated by Nginx Love UI

SecRuleRemoveById 942100
SecRuleRemoveById 942101
SecRuleRemoveById 942102
# ... etc
\`\`\`

## Important

- DO NOT edit these files manually while using the UI
- Files are auto-generated based on UI actions
- Nginx is auto-reloaded after changes
`;

      const readmePath = path.join(MODSEC_CRS_DISABLE_PATH, 'README.md');
      await fs.writeFile(readmePath, readmeContent, 'utf-8');
      logger.info('✓ Created README.md in crs_disabled directory');

      logger.info('✅ ModSecurity CRS management initialization completed');
    } catch (error: any) {
      if (error.code === 'EACCES') {
        logger.error('❌ Permission denied: Cannot write to ModSecurity directories');
        logger.error('   Please run the backend with sufficient permissions (root or sudo)');
      } else {
        logger.error('❌ ModSecurity initialization failed:', error);
      }
      logger.warn('⚠️  CRS rule management features may not work properly');
    }
  }
}

export const modSecSetupService = new ModSecSetupService();
