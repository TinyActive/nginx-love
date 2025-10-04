# Frequently Asked Questions

This section covers common questions about nginx-love.

## General Questions

### What is nginx-love?

nginx-love is a comprehensive management platform for Nginx and ModSecurity. It provides a user-friendly web interface to manage Nginx configurations, SSL certificates, ModSecurity rules, and monitor server performance.

### What are the system requirements?

nginx-love requires:
- Node.js 18 or higher
- PostgreSQL 12 or higher
- Nginx 1.18 or higher
- ModSecurity 2.9 or higher (optional)
- 2GB RAM minimum
- 10GB disk space minimum

### Is nginx-love free?

Yes, nginx-love is open-source and released under the MIT License.

### Can I use nginx-love in production?

Yes, nginx-love is designed for production use. However, always test in a staging environment first.

## Installation Questions

### How do I install nginx-love?

See the [installation guide](/guide/installation) for detailed installation instructions.

### Can I install nginx-love on Docker?

Yes, nginx-love provides Docker images for easy deployment. See the installation guide for Docker instructions.

### Do I need to install Nginx separately?

Yes, nginx-love manages existing Nginx installations but does not include Nginx itself.

## Domain Management Questions

### Can I manage multiple domains?

Yes, nginx-love is designed to manage multiple domains from a single interface.

### Can I use nginx-love with existing Nginx configurations?

Yes, nginx-love can import existing Nginx configurations. However, some manual adjustments may be needed.

### Can I create custom Nginx configurations?

Yes, nginx-love allows you to add custom Nginx directives for advanced configurations.

## SSL Questions

### Does nginx-love support wildcard certificates?

Yes, nginx-love supports wildcard certificates from Let's Encrypt and custom certificates.

### Can I use my own SSL certificates?

Yes, nginx-love allows you to upload and manage custom SSL certificates.

### How does automatic certificate renewal work?

nginx-love automatically renews Let's Encrypt certificates before they expire. You can configure the renewal threshold in the settings.

## ModSecurity Questions

### Do I need to install ModSecurity separately?

Yes, nginx-love manages ModSecurity configurations but does not include ModSecurity itself.

### Can I use custom ModSecurity rules?

Yes, nginx-love allows you to create and manage custom ModSecurity rules.

### What is the OWASP CRS?

The OWASP Core Rule Set (CRS) is a set of generic attack detection rules for ModSecurity. nginx-love supports the OWASP CRS with different paranoia levels.

## Performance Questions

### Does nginx-love impact Nginx performance?

nginx-love has minimal impact on Nginx performance. The main performance consideration is ModSecurity, which can add some overhead.

### Can I monitor performance metrics?

Yes, nginx-love provides comprehensive performance monitoring capabilities.

### How far back is performance data retained?

Performance data is retained for:
- Real-time: Last hour with 1-minute granularity
- Hourly: Last 24 hours with 1-hour granularity
- Daily: Last 30 days with 1-day granularity
- Monthly: Last 12 months with 1-month granularity

## Security Questions

### Is nginx-love secure?

Yes, nginx-love is designed with security in mind. It uses JWT tokens for authentication, supports two-factor authentication, and follows security best practices.

### Can I restrict access to specific features?

Yes, nginx-love supports role-based access control to restrict access to specific features.

### Does nginx-love store sensitive data?

nginx-love encrypts sensitive data such as passwords and private keys using AES-256 encryption.

## Integration Questions

### Can I integrate nginx-love with my existing tools?

Yes, nginx-love provides a REST API for integration with other tools.

### Does nginx-love support webhooks?

Yes, nginx-love supports webhooks for notifications and automation.

### Can I export data from nginx-love?

Yes, nginx-love allows you to export logs, configuration, and other data in various formats.

## Troubleshooting Questions

### Where can I find logs?

nginx-love logs are stored in the application logs directory. The specific location depends on your installation method.

### How do I report bugs?

Please report bugs on the [nginx-love GitHub repository](https://github.com/nginx-love/nginx-love/issues).

### Where can I get help?

You can get help from:
- The [documentation](/)
- The [GitHub repository](https://github.com/nginx-love/nginx-love)
- The community forums

## Licensing Questions

### Can I use nginx-love commercially?

Yes, nginx-love is released under the MIT License, which allows commercial use.

### Do I need to provide attribution?

The MIT License requires that you include the copyright notice and license text with any distribution of the software.

### Can I modify nginx-love?

Yes, the MIT License allows you to modify the software.

## Support Questions

### Is commercial support available?

Commercial support options are available. Please contact us for more information.

### How often is nginx-love updated?

nginx-love is actively developed with regular releases. You can check the [GitHub repository](https://github.com/nginx-love/nginx-love) for the latest releases.

### How do I stay updated with new releases?

You can watch the [GitHub repository](https://github.com/nginx-love/nginx-love) to receive notifications about new releases.