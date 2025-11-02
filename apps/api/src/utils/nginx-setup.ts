import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import logger from './logger';

const execAsync = promisify(exec);

const ACME_CHALLENGE_SNIPPET = `/etc/nginx/snippets/acme-challenge.conf`;
const WEBROOT_PATH = `/var/www/html`;
const ACME_CHALLENGE_PATH = `${WEBROOT_PATH}/.well-known/acme-challenge`;

const ACME_SNIPPET_CONTENT = `# ACME Challenge for ZeroSSL/Let's Encrypt
# Include this in your server blocks to enable webroot validation

location ^~ /.well-known/acme-challenge/ {
    default_type "text/plain";
    root /var/www/html;
    allow all;
}

location = /.well-known/acme-challenge/ {
    return 404;
}
`;

/**
 * Setup nginx snippets directory and ACME challenge configuration
 */
export async function setupNginxSnippets(): Promise<void> {
  try {
    // Create snippets directory if not exists
    const snippetsDir = path.dirname(ACME_CHALLENGE_SNIPPET);
    await execAsync(`mkdir -p ${snippetsDir}`);
    
    // Create ACME challenge snippet file
    await fs.writeFile(ACME_CHALLENGE_SNIPPET, ACME_SNIPPET_CONTENT, 'utf8');
    await execAsync(`chmod 644 ${ACME_CHALLENGE_SNIPPET}`);
    
    logger.info(`✅ Created nginx snippet: ${ACME_CHALLENGE_SNIPPET}`);
  } catch (error: any) {
    logger.error(`Failed to create nginx snippet: ${error.message}`);
    throw error;
  }
}

/**
 * Setup webroot directory for ACME challenges
 */
export async function setupWebrootDirectory(): Promise<void> {
  try {
    // Create webroot and .well-known/acme-challenge directories
    await execAsync(`mkdir -p ${ACME_CHALLENGE_PATH}`);
    await execAsync(`chmod -R 755 ${WEBROOT_PATH}`);
    
    logger.info(`✅ Created webroot directory: ${ACME_CHALLENGE_PATH}`);
  } catch (error: any) {
    logger.error(`Failed to create webroot directory: ${error.message}`);
    throw error;
  }
}

/**
 * Check if nginx snippet exists
 */
export async function checkNginxSnippet(): Promise<boolean> {
  try {
    await fs.access(ACME_CHALLENGE_SNIPPET);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if webroot directory exists
 */
export async function checkWebrootDirectory(): Promise<boolean> {
  try {
    await fs.access(ACME_CHALLENGE_PATH);
    return true;
  } catch {
    return false;
  }
}

/**
 * Initialize all required nginx configurations for SSL
 */
export async function initializeNginxForSSL(): Promise<void> {
  logger.info('🔧 Initializing nginx configuration for SSL/ACME...');
  
  try {
    // Check and create nginx snippet
    const snippetExists = await checkNginxSnippet();
    if (!snippetExists) {
      await setupNginxSnippets();
    } else {
      logger.info(`✓ Nginx snippet already exists: ${ACME_CHALLENGE_SNIPPET}`);
    }
    
    // Check and create webroot directory
    const webrootExists = await checkWebrootDirectory();
    if (!webrootExists) {
      await setupWebrootDirectory();
    } else {
      logger.info(`✓ Webroot directory already exists: ${ACME_CHALLENGE_PATH}`);
    }
    
    logger.info('✅ Nginx SSL/ACME initialization completed');
  } catch (error: any) {
    logger.error(`❌ Failed to initialize nginx for SSL: ${error.message}`);
    throw error;
  }
}

/**
 * Verify nginx configuration and reload if valid
 */
export async function reloadNginxIfValid(): Promise<void> {
  try {
    // Test nginx configuration
    const { stdout, stderr } = await execAsync('nginx -t 2>&1');
    
    if (stdout.includes('syntax is ok') && stdout.includes('test is successful')) {
      // Reload nginx
      await execAsync('nginx -s reload');
      logger.info('✅ Nginx reloaded successfully');
    } else {
      throw new Error(`Nginx config test failed: ${stdout} ${stderr}`);
    }
  } catch (error: any) {
    logger.error(`Failed to reload nginx: ${error.message}`);
    throw error;
  }
}

/**
 * Get nginx snippet include directive
 */
export function getNginxSnippetInclude(): string {
  return `include ${ACME_CHALLENGE_SNIPPET};`;
}

/**
 * Get webroot path for ACME challenges
 */
export function getWebrootPath(): string {
  return WEBROOT_PATH;
}

/**
 * Get ACME challenge directory path
 */
export function getAcmeChallengePath(): string {
  return ACME_CHALLENGE_PATH;
}
