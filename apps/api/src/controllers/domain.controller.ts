import { Response } from "express";
import prisma from "../config/database";
import { AuthRequest } from "../middleware/auth";
import logger from "../utils/logger";
import { validationResult } from "express-validator";
import * as fs from "fs/promises";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const NGINX_SITES_AVAILABLE = "/etc/nginx/sites-available";
const NGINX_SITES_ENABLED = "/etc/nginx/sites-enabled";

/**
 * Auto reload nginx with smart retry logic
 * @param silent - If true, don't throw errors, just log them
 */
async function autoReloadNginx(silent: boolean = false): Promise<boolean> {
  try {
    // Check if we're in a container environment
    const isContainer =
      process.env.NODE_ENV === "development" ||
      process.env.CONTAINERIZED === "true";
    logger.info(
      `Environment check - Container: ${isContainer}, Node Env: ${process.env.NODE_ENV}`
    );

    // Test nginx configuration first
    try {
      await execAsync("nginx -t");
      logger.info("Nginx configuration test passed");
    } catch (error: any) {
      logger.error("Nginx configuration test failed:", error.stderr);
      if (!silent) throw new Error(`Nginx config test failed: ${error.stderr}`);
      return false;
    }

    // Try graceful reload first
    try {
      if (isContainer) {
        logger.info("Auto-reloading nginx (container mode - direct signal)...");
        // In container, use direct nginx signal
        await execAsync("nginx -s reload");
      } else {
        logger.info("Auto-reloading nginx (host mode - systemctl)...");
        await execAsync("systemctl reload nginx");
      }

      // Wait for reload to take effect
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verify nginx is running
      if (isContainer) {
        // In container, check if nginx process is running
        const { stdout } = await execAsync(
          'pgrep nginx > /dev/null && echo "running" || echo "not running"'
        );
        if (stdout.trim() === "running") {
          logger.info("Nginx auto-reloaded successfully (container mode)");
          return true;
        }
      } else {
        // On host, use systemctl
        const { stdout } = await execAsync("systemctl is-active nginx");
        if (stdout.trim() === "active") {
          logger.info("Nginx auto-reloaded successfully (host mode)");
          return true;
        }
      }
    } catch (error: any) {
      logger.warn("Graceful reload failed, trying restart...", error.message);
    }

    // Fallback to restart
    if (isContainer) {
      logger.info("Auto-restarting nginx (container mode)...");
      // In container, we need to restart nginx differently
      // First check if nginx is running
      try {
        await execAsync("pgrep nginx");
        // If running, send reload signal again
        await execAsync("nginx -s reload");
      } catch (e) {
        // If not running, start nginx
        await execAsync("nginx");
      }
    } else {
      logger.info("Auto-restarting nginx (host mode)...");
      await execAsync("systemctl restart nginx");
    }

    // Wait for restart
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Verify nginx started
    if (isContainer) {
      const { stdout } = await execAsync(
        'pgrep nginx > /dev/null && echo "running" || echo "not running"'
      );
      if (stdout.trim() !== "running") {
        throw new Error("Nginx not running after restart (container mode)");
      }
    } else {
      const { stdout } = await execAsync("systemctl is-active nginx");
      if (stdout.trim() !== "active") {
        throw new Error("Nginx not active after restart (host mode)");
      }
    }

    logger.info(
      `Nginx auto-restarted successfully (${
        isContainer ? "container" : "host"
      } mode)`
    );
    return true;
  } catch (error: any) {
    logger.error("Auto reload nginx failed:", error);
    if (!silent) throw error;
    return false;
  }
}

/**
 * Get all domains with search and pagination
 */
export const getDomains = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "",
      sslEnabled = "",
      modsecEnabled = "",
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause for search
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (sslEnabled !== "") {
      where.sslEnabled = sslEnabled === "true";
    }

    if (modsecEnabled !== "") {
      where.modsecEnabled = modsecEnabled === "true";
    }

    // Get total count for pagination
    const totalCount = await prisma.domain.count({ where });

    // Get domains with pagination and filters
    const domains = await prisma.domain.findMany({
      where,
      include: {
        upstreams: true,
        loadBalancer: true,
        sslCertificate: {
          select: {
            id: true,
            commonName: true,
            validFrom: true,
            validTo: true,
            status: true,
          },
        },
        modsecRules: {
          where: { enabled: true },
          select: { id: true, name: true, category: true },
        },
      },
      orderBy: { [sortBy as string]: sortOrder as "asc" | "desc" },
      skip,
      take: limitNum,
    });

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPreviousPage = pageNum > 1;

    res.json({
      success: true,
      data: domains,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    });
  } catch (error) {
    logger.error("Get domains error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Get domain by ID
 */
export const getDomainById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const domain = await prisma.domain.findUnique({
      where: { id },
      include: {
        upstreams: true,
        loadBalancer: true,
        sslCertificate: true,
        modsecRules: true,
      },
    });

    if (!domain) {
      res.status(404).json({
        success: false,
        message: "Domain not found",
      });
      return;
    }

    res.json({
      success: true,
      data: domain,
    });
  } catch (error) {
    logger.error("Get domain by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Create new domain
 */
export const createDomain = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    const { name, upstreams, loadBalancer, modsecEnabled } = req.body;

    // Check if domain already exists
    const existingDomain = await prisma.domain.findUnique({
      where: { name },
    });

    if (existingDomain) {
      res.status(400).json({
        success: false,
        message: "Domain already exists",
      });
      return;
    }

    // Create domain with related data
    const domain = await prisma.domain.create({
      data: {
        name,
        status: "inactive",
        modsecEnabled: modsecEnabled !== undefined ? modsecEnabled : true,
        upstreams: {
          create: upstreams.map((u: any) => ({
            host: u.host,
            port: u.port,
            protocol: u.protocol || "http",
            sslVerify: u.sslVerify !== undefined ? u.sslVerify : true,
            weight: u.weight || 1,
            maxFails: u.maxFails || 3,
            failTimeout: u.failTimeout || 10,
            status: "checking",
          })),
        },
        loadBalancer: {
          create: {
            algorithm: loadBalancer?.algorithm || "round_robin",
            healthCheckEnabled:
              loadBalancer?.healthCheckEnabled !== undefined
                ? loadBalancer.healthCheckEnabled
                : true,
            healthCheckInterval: loadBalancer?.healthCheckInterval || 30,
            healthCheckTimeout: loadBalancer?.healthCheckTimeout || 5,
            healthCheckPath: loadBalancer?.healthCheckPath || "/",
          },
        },
      },
      include: {
        upstreams: true,
        loadBalancer: true,
      },
    });

    // Generate nginx configuration
    await generateNginxConfig(domain);

    // Update domain status to active after successful config generation
    const updatedDomain = await prisma.domain.update({
      where: { id: domain.id },
      data: { status: "active" },
      include: {
        upstreams: true,
        loadBalancer: true,
      },
    });

    // Create symlink now that status is active
    const configPath = path.join(NGINX_SITES_AVAILABLE, `${domain.name}.conf`);
    const enabledPath = path.join(NGINX_SITES_ENABLED, `${domain.name}.conf`);
    try {
      await fs.unlink(enabledPath).catch(() => {});
      await fs.symlink(configPath, enabledPath);
    } catch (error) {
      logger.error(`Failed to enable config for ${domain.name}:`, error);
    }

    // Auto-reload nginx (silent mode - don't fail domain creation if reload fails)
    await autoReloadNginx(true);

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user!.userId,
        action: `Created domain: ${name}`,
        type: "config_change",
        ip: req.ip || "unknown",
        userAgent: req.headers["user-agent"] || "unknown",
        success: true,
      },
    });

    logger.info(`Domain ${name} created by user ${req.user!.username}`);

    res.status(201).json({
      success: true,
      message: "Domain created successfully",
      data: updatedDomain,
    });
  } catch (error) {
    logger.error("Create domain error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Update domain
 */
export const updateDomain = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    const { id } = req.params;
    const { name, status, modsecEnabled, upstreams, loadBalancer } = req.body;

    const domain = await prisma.domain.findUnique({
      where: { id },
    });

    if (!domain) {
      res.status(404).json({
        success: false,
        message: "Domain not found",
      });
      return;
    }

    // Update domain
    const updatedDomain = await prisma.domain.update({
      where: { id },
      data: {
        name: name || domain.name,
        status: status || domain.status,
        modsecEnabled:
          modsecEnabled !== undefined ? modsecEnabled : domain.modsecEnabled,
      },
      include: {
        upstreams: true,
        loadBalancer: true,
      },
    });

    // Update upstreams if provided
    if (upstreams && Array.isArray(upstreams)) {
      // Delete existing upstreams
      await prisma.upstream.deleteMany({
        where: { domainId: id },
      });

      // Create new upstreams
      await prisma.upstream.createMany({
        data: upstreams.map((u: any) => ({
          domainId: id,
          host: u.host,
          port: u.port,
          protocol: u.protocol || "http",
          sslVerify: u.sslVerify !== undefined ? u.sslVerify : true,
          weight: u.weight || 1,
          maxFails: u.maxFails || 3,
          failTimeout: u.failTimeout || 10,
          status: "checking",
        })),
      });
    }

    // Update load balancer if provided
    if (loadBalancer) {
      await prisma.loadBalancerConfig.upsert({
        where: { domainId: id },
        create: {
          domainId: id,
          algorithm: loadBalancer.algorithm || "round_robin",
          healthCheckEnabled:
            loadBalancer.healthCheckEnabled !== undefined
              ? loadBalancer.healthCheckEnabled
              : true,
          healthCheckInterval: loadBalancer.healthCheckInterval || 30,
          healthCheckTimeout: loadBalancer.healthCheckTimeout || 5,
          healthCheckPath: loadBalancer.healthCheckPath || "/",
        },
        update: {
          algorithm: loadBalancer.algorithm,
          healthCheckEnabled: loadBalancer.healthCheckEnabled,
          healthCheckInterval: loadBalancer.healthCheckInterval,
          healthCheckTimeout: loadBalancer.healthCheckTimeout,
          healthCheckPath: loadBalancer.healthCheckPath,
        },
      });
    }

    // Regenerate nginx config
    const finalDomain = await prisma.domain.findUnique({
      where: { id },
      include: {
        upstreams: true,
        loadBalancer: true,
        sslCertificate: true,
      },
    });

    if (finalDomain) {
      await generateNginxConfig(finalDomain);

      // Auto-reload nginx after config update
      await autoReloadNginx(true);
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user!.userId,
        action: `Updated domain: ${updatedDomain.name}`,
        type: "config_change",
        ip: req.ip || "unknown",
        userAgent: req.headers["user-agent"] || "unknown",
        success: true,
      },
    });

    logger.info(
      `Domain ${updatedDomain.name} updated by user ${req.user!.username}`
    );

    res.json({
      success: true,
      message: "Domain updated successfully",
      data: finalDomain,
    });
  } catch (error) {
    logger.error("Update domain error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Delete domain
 */
export const deleteDomain = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const domain = await prisma.domain.findUnique({
      where: { id },
    });

    if (!domain) {
      res.status(404).json({
        success: false,
        message: "Domain not found",
      });
      return;
    }

    // Delete nginx configuration
    await deleteNginxConfig(domain.name);

    // Delete domain (cascade will delete related data)
    await prisma.domain.delete({
      where: { id },
    });

    // Auto-reload nginx after deleting config
    await autoReloadNginx(true);

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user!.userId,
        action: `Deleted domain: ${domain.name}`,
        type: "config_change",
        ip: req.ip || "unknown",
        userAgent: req.headers["user-agent"] || "unknown",
        success: true,
      },
    });

    logger.info(`Domain ${domain.name} deleted by user ${req.user!.username}`);

    res.json({
      success: true,
      message: "Domain deleted successfully",
    });
  } catch (error) {
    logger.error("Delete domain error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Reload nginx configuration with smart retry logic
 */
export const reloadNginx = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Check if we're in a container environment
    const isContainer =
      process.env.NODE_ENV === "development" ||
      process.env.CONTAINERIZED === "true";
    logger.info(
      `[reloadNginx] Environment check - Container: ${isContainer}, Node Env: ${process.env.NODE_ENV}`
    );

    // Test nginx configuration first
    try {
      await execAsync("nginx -t");
      logger.info("[reloadNginx] Nginx configuration test passed");
    } catch (error: any) {
      logger.error("[reloadNginx] Nginx configuration test failed:", error);
      res.status(400).json({
        success: false,
        message: "Nginx configuration test failed",
        details: error.stderr,
      });
      return;
    }

    let reloadMethod = "reload";
    let reloadSuccess = false;

    // Try graceful reload first
    try {
      if (isContainer) {
        logger.info(
          "[reloadNginx] Attempting graceful nginx reload (container mode)..."
        );
        await execAsync("nginx -s reload");
      } else {
        logger.info(
          "[reloadNginx] Attempting graceful nginx reload (host mode)..."
        );
        await execAsync("systemctl reload nginx");
      }

      // Wait a bit for reload to take effect
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Verify nginx is still running
      if (isContainer) {
        const { stdout } = await execAsync(
          'pgrep nginx > /dev/null && echo "running" || echo "not running"'
        );
        if (stdout.trim() === "running") {
          reloadSuccess = true;
          logger.info(
            "[reloadNginx] Nginx reloaded successfully (container mode)"
          );
        }
      } else {
        const { stdout } = await execAsync("systemctl is-active nginx");
        if (stdout.trim() === "active") {
          reloadSuccess = true;
          logger.info("[reloadNginx] Nginx reloaded successfully (host mode)");
        }
      }
    } catch (error: any) {
      logger.warn(
        "[reloadNginx] Graceful reload failed or verification failed:",
        error.message
      );
    }

    // If reload failed or verification failed, try restart
    if (!reloadSuccess) {
      logger.info("[reloadNginx] Falling back to nginx restart...");
      try {
        if (isContainer) {
          logger.info("[reloadNginx] Restarting nginx (container mode)...");
          // Check if nginx is running
          try {
            await execAsync("pgrep nginx");
            // If running, try to stop and start
            await execAsync("nginx -s stop");
            await new Promise((resolve) => setTimeout(resolve, 500));
            await execAsync("nginx");
          } catch (e) {
            // If not running, just start it
            await execAsync("nginx");
          }
        } else {
          logger.info("[reloadNginx] Restarting nginx (host mode)...");
          await execAsync("systemctl restart nginx");
        }

        reloadMethod = "restart";

        // Wait for restart to complete
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Verify nginx started successfully
        if (isContainer) {
          const { stdout } = await execAsync(
            'pgrep nginx > /dev/null && echo "running" || echo "not running"'
          );
          if (stdout.trim() !== "running") {
            throw new Error(
              "Nginx failed to start after restart (container mode)"
            );
          }
        } else {
          const { stdout } = await execAsync("systemctl is-active nginx");
          if (stdout.trim() !== "active") {
            throw new Error("Nginx failed to start after restart (host mode)");
          }
        }

        reloadSuccess = true;
        logger.info(
          `[reloadNginx] Nginx restarted successfully (${
            isContainer ? "container" : "host"
          } mode)`
        );
      } catch (restartError: any) {
        logger.error("[reloadNginx] Nginx restart failed:", restartError);
        throw new Error(`Failed to reload nginx: ${restartError.message}`);
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user!.userId,
        action: `Nginx ${reloadMethod} successful (${
          isContainer ? "container" : "host"
        } mode)`,
        type: "config_change",
        ip: req.ip || "unknown",
        userAgent: req.headers["user-agent"] || "unknown",
        success: true,
      },
    });

    logger.info(
      `[reloadNginx] Nginx ${reloadMethod} by user ${req.user!.username} (${
        isContainer ? "container" : "host"
      } mode)`
    );

    res.json({
      success: true,
      message: `Nginx ${
        reloadMethod === "restart" ? "restarted" : "reloaded"
      } successfully`,
      method: reloadMethod,
      mode: isContainer ? "container" : "host",
    });
  } catch (error: any) {
    logger.error("[reloadNginx] Reload nginx error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to reload nginx",
    });
  }
};

/**
 * Toggle SSL for domain (Enable/Disable SSL)
 */
export const toggleSSL = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { sslEnabled } = req.body;

    if (typeof sslEnabled !== "boolean") {
      res.status(400).json({
        success: false,
        message: "sslEnabled must be a boolean value",
      });
      return;
    }

    const domain = await prisma.domain.findUnique({
      where: { id },
      include: {
        sslCertificate: true,
        upstreams: true,
        loadBalancer: true,
      },
    });

    if (!domain) {
      res.status(404).json({
        success: false,
        message: "Domain not found",
      });
      return;
    }

    // If enabling SSL, check if certificate exists
    if (sslEnabled && !domain.sslCertificate) {
      res.status(400).json({
        success: false,
        message:
          "Cannot enable SSL: No SSL certificate found for this domain. Please issue or upload a certificate first.",
      });
      return;
    }

    // Update domain SSL status
    await prisma.domain.update({
      where: { id },
      data: {
        sslEnabled,
        sslExpiry:
          sslEnabled && domain.sslCertificate
            ? domain.sslCertificate.validTo
            : null,
      },
    });

    // Fetch updated domain with all relations for nginx config
    const updatedDomain = await prisma.domain.findUnique({
      where: { id },
      include: {
        upstreams: true,
        loadBalancer: true,
        sslCertificate: true,
      },
    });

    if (!updatedDomain) {
      throw new Error("Failed to fetch updated domain");
    }

    logger.info(`Fetched domain for nginx config: ${updatedDomain.name}`);
    logger.info(`- sslEnabled: ${updatedDomain.sslEnabled}`);
    logger.info(`- sslCertificate exists: ${!!updatedDomain.sslCertificate}`);
    if (updatedDomain.sslCertificate) {
      logger.info(`- Certificate ID: ${updatedDomain.sslCertificate.id}`);
      logger.info(
        `- Certificate commonName: ${updatedDomain.sslCertificate.commonName}`
      );
    }

    // Regenerate nginx config with SSL settings
    await generateNginxConfig(updatedDomain);

    // Auto-reload nginx
    await autoReloadNginx(true);

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user!.userId,
        action: `${sslEnabled ? "Enabled" : "Disabled"} SSL for domain: ${
          domain.name
        }`,
        type: "config_change",
        ip: req.ip || "unknown",
        userAgent: req.headers["user-agent"] || "unknown",
        success: true,
      },
    });

    logger.info(
      `SSL ${sslEnabled ? "enabled" : "disabled"} for ${domain.name} by user ${
        req.user!.username
      }`
    );

    res.json({
      success: true,
      message: `SSL ${sslEnabled ? "enabled" : "disabled"} successfully`,
      data: updatedDomain,
    });
  } catch (error) {
    logger.error("Toggle SSL error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Generate nginx configuration for domain
 */
async function generateNginxConfig(domain: any): Promise<void> {
  const configPath = path.join(NGINX_SITES_AVAILABLE, `${domain.name}.conf`);
  const enabledPath = path.join(NGINX_SITES_ENABLED, `${domain.name}.conf`);

  // Debug logging
  logger.info(`Generating nginx config for ${domain.name}:`);
  logger.info(`- SSL Enabled: ${domain.sslEnabled}`);
  logger.info(`- Has SSL Certificate: ${!!domain.sslCertificate}`);
  if (domain.sslCertificate) {
    logger.info(`- Certificate ID: ${domain.sslCertificate.id}`);
  }

  // Determine if any upstream uses HTTPS
  const hasHttpsUpstream = domain.upstreams.some(
    (u: any) => u.protocol === "https"
  );
  const upstreamProtocol = hasHttpsUpstream ? "https" : "http";

  // Generate upstream block
  const upstreamBlock = `
upstream ${domain.name.replace(/\./g, "_")}_backend {
    ${domain.loadBalancer?.algorithm === "least_conn" ? "least_conn;" : ""}
    ${domain.loadBalancer?.algorithm === "ip_hash" ? "ip_hash;" : ""}
    
    ${domain.upstreams
      .map(
        (u: any) =>
          `server ${u.host}:${u.port} weight=${u.weight} max_fails=${u.maxFails} fail_timeout=${u.failTimeout}s;`
      )
      .join("\n    ")}
}
`;

  // HTTP server block (always present)
  let httpServerBlock = `
server {
    listen 80;
    server_name ${domain.name};
    
    # Include ACL rules (IP whitelist/blacklist)
    include /etc/nginx/conf.d/acl-rules.conf;
    
    # Include ACME challenge location for Let's Encrypt
    include /etc/nginx/snippets/acme-challenge.conf;
    
    ${
      domain.sslEnabled
        ? `
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
    `
        : `
    ${domain.modsecEnabled ? "modsecurity on;" : "modsecurity off;"}
    
    access_log /var/log/nginx/${domain.name}_access.log main;
    error_log /var/log/nginx/${domain.name}_error.log warn;
    
    location / {
        proxy_pass ${upstreamProtocol}://${domain.name.replace(
            /\./g,
            "_"
          )}_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        ${
          hasHttpsUpstream
            ? `
        # HTTPS Backend Settings
        ${
          domain.upstreams.some(
            (u: any) => u.protocol === "https" && !u.sslVerify
          )
            ? "proxy_ssl_verify off;"
            : "proxy_ssl_verify on;"
        }
        proxy_ssl_server_name on;
        proxy_ssl_name ${domain.name};
        proxy_ssl_protocols TLSv1.2 TLSv1.3;
        `
            : ""
        }
        
        ${
          domain.loadBalancer?.healthCheckEnabled
            ? `
        # Health check settings
        proxy_next_upstream error timeout http_502 http_503 http_504;
        proxy_next_upstream_tries 3;
        proxy_next_upstream_timeout ${domain.loadBalancer.healthCheckTimeout}s;
        `
            : ""
        }
    }
    
    location /nginx_health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }
    `
    }
}
`;

  // HTTPS server block (only if SSL enabled)
  let httpsServerBlock = "";
  if (domain.sslEnabled && domain.sslCertificate) {
    httpsServerBlock = `
server {
    listen 443 ssl http2;
    server_name ${domain.name};
    
    # Include ACL rules (IP whitelist/blacklist)
    include /etc/nginx/conf.d/acl-rules.conf;
    
    # SSL Certificate Configuration
    ssl_certificate /etc/nginx/ssl/${domain.name}.crt;
    ssl_certificate_key /etc/nginx/ssl/${domain.name}.key;
    ${
      domain.sslCertificate.chain
        ? `ssl_trusted_certificate /etc/nginx/ssl/${domain.name}.chain.crt;`
        : ""
    }
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-DSS-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:DHE-RSA-AES256-SHA:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!3DES:!MD5:!PSK;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    ${domain.modsecEnabled ? "modsecurity on;" : "modsecurity off;"}
    
    access_log /var/log/nginx/${domain.name}_ssl_access.log main;
    error_log /var/log/nginx/${domain.name}_ssl_error.log warn;
    
    location / {
        proxy_pass ${upstreamProtocol}://${domain.name.replace(
      /\./g,
      "_"
    )}_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        ${
          hasHttpsUpstream
            ? `
        # HTTPS Backend Settings
        ${
          domain.upstreams.some(
            (u: any) => u.protocol === "https" && !u.sslVerify
          )
            ? "proxy_ssl_verify off;"
            : "proxy_ssl_verify on;"
        }
        proxy_ssl_server_name on;
        proxy_ssl_name ${domain.name};
        proxy_ssl_protocols TLSv1.2 TLSv1.3;
        `
            : ""
        }
        
        ${
          domain.loadBalancer?.healthCheckEnabled
            ? `
        # Health check settings
        proxy_next_upstream error timeout http_502 http_503 http_504;
        proxy_next_upstream_tries 3;
        proxy_next_upstream_timeout ${domain.loadBalancer.healthCheckTimeout}s;
        `
            : ""
        }
    }
    
    location /nginx_health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }
}
`;
  }

  const fullConfig = upstreamBlock + httpServerBlock + httpsServerBlock;

  // Write configuration file
  try {
    await fs.mkdir(NGINX_SITES_AVAILABLE, { recursive: true });
    await fs.mkdir(NGINX_SITES_ENABLED, { recursive: true });
    await fs.writeFile(configPath, fullConfig);

    // Create symlink if domain is active
    if (domain.status === "active") {
      try {
        await fs.unlink(enabledPath);
      } catch (e) {
        // File doesn't exist, ignore
      }
      await fs.symlink(configPath, enabledPath);
    }

    logger.info(`Nginx configuration generated for ${domain.name}`);
  } catch (error) {
    logger.error(`Failed to write nginx config for ${domain.name}:`, error);
    throw error;
  }
}

/**
 * Delete nginx configuration for domain
 */
async function deleteNginxConfig(domainName: string): Promise<void> {
  const configPath = path.join(NGINX_SITES_AVAILABLE, `${domainName}.conf`);
  const enabledPath = path.join(NGINX_SITES_ENABLED, `${domainName}.conf`);

  try {
    await fs.unlink(enabledPath).catch(() => {});
    await fs.unlink(configPath).catch(() => {});
    logger.info(`Nginx configuration deleted for ${domainName}`);
  } catch (error) {
    logger.error(`Failed to delete nginx config for ${domainName}:`, error);
  }
}
