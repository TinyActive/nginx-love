# Quick Start Guide

This guide will help you get up and running with the Nginx WAF Management Platform quickly. We'll walk you through the essential steps to configure your first domain and enable security features.

## Prerequisites

Before you begin, ensure you have:
- Completed the [installation](/guide/installation) process
- Access to the web interface (http://localhost:8080 or http://YOUR_IP:8080)
- Default login credentials (admin/admin123)

## Step 1: First Login

### Access the Login Page

Open your web browser and navigate to the nginx-love interface:
- **Development**: http://localhost:8080
- **Production**: http://YOUR_IP:8080

You'll see the login screen:

![Login Screen](/reference/screenshots/login.png)

### Initial Login

Use the default credentials:
```
Username: admin
Password: admin123
```

⚠️ **Security Warning**: You'll be prompted to change the default password immediately after login.

### Change Default Password

1. After successful login, you'll be redirected to the profile page
2. Enter your current password (admin123)
3. Set a strong new password with at least 8 characters
4. Confirm the new password
5. Click "Change Password"

## Step 2: Dashboard Overview

After changing your password, you'll be taken to the main dashboard:

![Dashboard](/reference/screenshots/Dashboard.png)

The dashboard provides:
- **System Overview**: CPU, Memory, and Network statistics
- **Domain Statistics**: Active domains, SSL status, and security alerts
- **Recent Activity**: Latest system events and configuration changes
- **Quick Actions**: Easy access to common tasks

## Step 3: Add Your First Domain

### Navigate to Domain Management

1. Click on **Domains** in the sidebar navigation
2. You'll see the domain management interface:

![Domain Management](/reference/screenshots/Domain_Management.png)

### Create a New Domain

1. Click the **Add Domain** button
2. Fill in the domain details:

![Add Domain](/reference/screenshots/domain_add.png)

**Required Fields:**
- **Domain Name**: e.g., `example.com` or `api.example.com`
- **Upstream Servers**: At least one backend server

**Upstream Configuration:**
- **Host**: IP address or hostname of your backend server
- **Port**: Port number (e.g., 80, 8080, 3000)
- **Protocol**: HTTP or HTTPS
- **Weight**: Load balancing weight (default: 1)
- **Max Fails**: Maximum failed attempts before marking as down (default: 3)
- **Fail Timeout**: Timeout in seconds before retrying (default: 10)

**Example Configuration:**
```
Domain Name: api.example.com
Upstream Server 1:
  Host: 192.168.1.100
  Port: 8080
  Protocol: HTTP
  Weight: 1
  Max Fails: 3
  Fail Timeout: 10
```

3. Click **Save** to create the domain

### Verify Domain Creation

After saving, you'll see your new domain in the list with status indicators:
- **Status**: Active/Inactive/Error
- **SSL**: Enabled/Disabled
- **ModSecurity**: Enabled/Disabled
- **Upstreams**: Health status of backend servers

## Step 4: Configure SSL Certificate

### Enable SSL for Your Domain

1. Select your domain from the list
2. Click the **SSL** tab
3. Click **Enable SSL**

### Choose SSL Method

You have two options for SSL certificates:

#### Option 1: Let's Encrypt (Recommended)

![Add SSL](/reference/screenshots/ssl_add.png)

1. Select **Let's Encrypt** as the certificate provider
2. Enter your email address for certificate notifications
3. Ensure your domain points to this server (DNS A record)
4. Click **Save and Issue Certificate**

The system will:
- Validate domain ownership
- Generate a certificate
- Configure automatic renewal (default: 30 days before expiry)

#### Option 2: Manual Certificate Upload

1. Select **Manual Upload**
2. Upload your certificate files:
   - **Certificate**: Your domain certificate (.crt or .pem)
   - **Private Key**: Your private key (.key)
   - **Chain**: Certificate chain (optional)
3. Enter issuer information
4. Click **Save**

### Verify SSL Configuration

After successful configuration, you'll see:

![SSL Certificate](/reference/screenshots/ssl_cert.png)

- **Certificate Details**: Common name, SANs, issuer, validity period
- **Auto-renewal Status**: Enabled/Disabled
- **Certificate Status**: Valid/Expiring/Expired

## Step 5: Configure ModSecurity WAF

### Enable ModSecurity

1. Select your domain from the list
2. Click the **ModSecurity** tab
3. Toggle **Enable ModSecurity**

![ModSecurity](/reference/screenshots/modsecurity.png)

### Configure OWASP CRS Rules

1. **Rule Categories**: View available rule categories
   - SQL Injection Protection
   - Cross-Site Scripting (XSS)
   - Remote File Inclusion
   - PHP Injection
   - Session Fixation

2. **Paranoia Level**: Choose security level
   - **Level 1**: Default (recommended for most applications)
   - **Level 2**: Higher security, some false positives possible
   - **Level 3**: Very high security, more false positives
   - **Level 4**: Maximum security, requires extensive testing

3. **Enable/Disable Rules**: Toggle individual rules as needed

### Add Custom Rules (Optional)

1. Click **Add Custom Rule**
2. Enter rule details:
   - **Name**: Descriptive rule name
   - **Category**: Rule category
   - **Rule Content**: ModSecurity rule syntax
   - **Description**: What the rule does
3. Click **Save**

Example custom rule:
```
SecRule REQUEST_HEADERS:User-Agent "@rx bot|crawler|scanner" \
    "id:1001,\
    phase:1,\
    deny,\
    status:403,\
    msg:'Block known bots and scanners'"
```

## Step 6: Configure Access Control Lists (ACL)

### Navigate to ACL Settings

1. Click **ACL** in the sidebar
2. You'll see the ACL management interface:

![ACL](/reference/screenshots/acl.png)

### Create ACL Rules

1. Click **Add ACL Rule**
2. Configure rule parameters:

![Add ACL](/reference/screenshots/ACL_add.png)

**Rule Configuration:**
- **Name**: Descriptive rule name
- **Type**: Whitelist or Blacklist
- **Condition Field**: IP, GeoIP, User-Agent, URL, Method, Header
- **Operator**: Equals, Contains, Regex
- **Condition Value**: The value to match
- **Action**: Allow, Deny, Challenge

**Example Rules:**

1. **Block Specific IP**:
   ```
   Name: Block Malicious IP
   Type: Blacklist
   Field: IP
   Operator: Equals
   Value: 192.168.1.50
   Action: Deny
   ```

2. **Allow Internal Network**:
   ```
   Name: Allow Internal Network
   Type: Whitelist
   Field: IP
   Operator: Regex
   Value: ^192\.168\.1\.
   Action: Allow
   ```

3. **Block Bad Bots**:
   ```
   Name: Block Bad Bots
   Type: Blacklist
   Field: User-Agent
   Operator: Contains
   Value: malware
   Action: Deny
   ```

## Step 7: Set Up Monitoring and Alerts

### Configure Notification Channels

1. Click **Alerts** in the sidebar
2. Go to **Notification Channels** tab
3. Click **Add Channel**

![Alert Channel](/reference/screenshots/alert_chanel.png)

**Email Channel Configuration:**
- **Name**: Email Notifications
- **Type**: Email
- **SMTP Settings**: Server, port, username, password
- **Recipients**: Email addresses to receive alerts

**Telegram Channel Configuration:**
- **Name**: Telegram Bot
- **Type**: Telegram
- **Bot Token**: Your Telegram bot token
- **Chat ID**: Telegram chat ID for notifications

### Create Alert Rules

1. Go to **Alert Rules** tab
2. Click **Add Rule**

![Alert Rule](/reference/screenshots/alert_rule.png)

**Common Alert Rules:**

1. **High CPU Usage**:
   ```
   Name: High CPU Usage
   Condition: cpu > 80
   Threshold: 80
   Severity: Warning
   Check Interval: 300 seconds
   ```

2. **Backend Server Down**:
   ```
   Name: Backend Server Down
   Condition: upstream_status == down
   Threshold: 1
   Severity: Critical
   Check Interval: 60 seconds
   ```

3. **SSL Certificate Expiry**:
   ```
   Name: SSL Certificate Expiring
   Condition: ssl_days_to_expiry < 30
   Threshold: 30
   Severity: Warning
   Check Interval: 86400 seconds (24 hours)
   ```

## Step 8: User Management

### Create Additional Users

1. Click **Users** in the sidebar
2. You'll see the user management interface:

![User Management](/reference/screenshots/User_Management.png)

3. Click **Add User**
4. Fill in user details:
   - **Username**: Unique username
   - **Email**: Email address
   - **Full Name**: Display name
   - **Role**: Admin, Moderator, or Viewer
   - **Password**: Initial password
   - **Status**: Active or Inactive

**User Roles:**
- **Admin**: Full access to all features and settings
- **Moderator**: Can manage domains, SSL, and security rules
- **Viewer**: Read-only access to dashboards and reports

## Step 9: Performance Monitoring

### View Performance Metrics

1. Click **Performance** in the sidebar
2. You'll see performance monitoring:

![Performance](/reference/screenshots/Performance.png)

**Available Metrics:**
- **Response Time**: Average response time over time
- **Throughput**: Requests per second
- **Error Rate**: Percentage of failed requests
- **Bandwidth**: Network usage statistics

### Analyze Domain Performance

1. Select a specific domain from the dropdown
2. View detailed metrics for that domain
3. Identify performance bottlenecks
4. Monitor trends over time

## Step 10: Log Analysis

### View System Logs

1. Click **Logs** in the sidebar
2. Filter logs by:
   - **Type**: Access, Error, ModSecurity, System
   - **Domain**: Specific domain
   - **Time Range**: Custom date range
   - **Severity**: Error, Warning, Info

![Domain Logs](/reference/screenshots/domain_log.png)

### Search and Filter Logs

1. Use the search bar to find specific log entries
2. Apply filters to narrow down results
3. Export logs for further analysis
4. Monitor security events in real-time

## What's Next?

Congratulations! You've successfully set up your first domain with the Nginx WAF Management Platform. Here are some recommended next steps:

### Additional Configuration

1. **Set Up Backup**: Configure regular backups of your configuration
2. **Fine-tune Security**: Adjust ModSecurity rules based on your application needs
3. **Optimize Performance**: Monitor and optimize load balancing settings
4. **Configure Additional Domains**: Add more domains to manage

### Advanced Features

- [**SSL Certificate Management**](/guide/ssl): Learn about advanced SSL configurations
- [**ModSecurity Rules**](/guide/modsecurity): Create custom WAF rules
- [**Performance Optimization**](/guide/performance): Advanced monitoring and optimization
- [**Log Analysis**](/guide/logs): Deep dive into log analysis and troubleshooting
- [**API Integration**](/api/): Integrate with external systems via REST API

### Maintenance and Monitoring

- Regularly check system health and performance
- Monitor SSL certificate expiry dates
- Review security logs for potential threats
- Keep the system updated with latest security patches

## Need Help?

If you encounter any issues or have questions:

- Check our [troubleshooting guide](/reference/troubleshooting)
- Review the [FAQ](/reference/faq)
- Browse our [API documentation](/api/)
- Contact support for assistance

## Installation Complete

The installation wizard will show a completion screen when all components are successfully installed:

![Installation Complete](/reference/screenshots/installation_complete.png)

Your nginx-love platform is now ready for production use!