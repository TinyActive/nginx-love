# Troubleshooting

This section covers common issues and their solutions when using nginx-love.

## Installation Issues

### Database Connection Failed

**Problem:** nginx-love cannot connect to the database.

**Solution:**
1. Check that your database server is running
2. Verify the database connection settings in your `.env` file
3. Ensure the database user has the necessary permissions
4. Check if the database exists

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check database connection
psql -h localhost -U nginx_love -d nginx_love
```

### Permission Denied

**Problem:** nginx-love cannot access Nginx configuration files.

**Solution:**
1. Ensure the nginx-love user has permission to access Nginx files
2. Add the nginx-love user to the appropriate groups

```bash
# Add user to www-data group
sudo usermod -a -G www-data nginx-love

# Set appropriate permissions
sudo chown -R www-data:www-data /etc/nginx
sudo chmod -R 755 /etc/nginx
```

## Domain Issues

### Domain Not Working

**Problem:** A newly created domain is not accessible.

**Solution:**
1. Check that the DNS record for the domain is pointing to your server
2. Verify that Nginx configuration was generated correctly
3. Reload Nginx configuration

```bash
# Check Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### SSL Certificate Not Issued

**Problem:** Let's Encrypt certificate cannot be issued.

**Solution:**
1. Ensure the domain is pointing to your server
2. Check that port 80 is accessible from the internet
3. Verify that Let's Encrypt can reach the validation file

```bash
# Check if port 80 is accessible
telnet your-domain.com 80

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

## ModSecurity Issues

### ModSecurity Not Working

**Problem:** ModSecurity rules are not being applied.

**Solution:**
1. Verify that ModSecurity is installed and enabled
2. Check that the ModSecurity configuration is correct
3. Ensure the rule set is properly configured

```bash
# Check ModSecurity status
sudo nginx -V | grep modsecurity

# Check ModSecurity logs
sudo tail -f /var/log/modsec_audit.log
```

### False Positives

**Problem:** Legitimate requests are being blocked by ModSecurity.

**Solution:**
1. Review the ModSecurity logs to identify the rule causing the issue
2. Create exclusions for specific rules or endpoints
3. Consider lowering the paranoia level

## Performance Issues

### High Memory Usage

**Problem:** nginx-love is using excessive memory.

**Solution:**
1. Check for memory leaks
2. Optimize database queries
3. Implement caching

```bash
# Check memory usage
ps aux | grep nginx-love

# Check database connections
psql -h localhost -U nginx_love -d nginx_love -c "SELECT * FROM pg_stat_activity;"
```

### Slow Response Times

**Problem:** nginx-love is responding slowly to requests.

**Solution:**
1. Check system resources
2. Optimize database performance
3. Review Nginx configuration

```bash
# Check system resources
top

# Check database performance
psql -h localhost -U nginx_love -d nginx_love -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

## Log Analysis Issues

### Logs Not Appearing

**Problem:** Access or error logs are not showing up in nginx-love.

**Solution:**
1. Verify that log paths are correct in the configuration
2. Ensure the nginx-love user has permission to read log files
3. Check that log rotation is not interfering

```bash
# Check log file permissions
ls -la /var/log/nginx/

# Check log rotation
sudo cat /etc/logrotate.d/nginx
```

### Log Parsing Errors

**Problem:** nginx-love cannot parse log files correctly.

**Solution:**
1. Verify that log format matches expected format
2. Check for corrupted log files
3. Review custom log format configuration

## SSL Issues

### Certificate Renewal Failed

**Problem:** Let's Encrypt certificate renewal failed.

**Solution:**
1. Check that the domain is still pointing to your server
2. Verify that the Let's Encrypt account is valid
3. Review renewal logs for specific error messages

```bash
# Check renewal logs
sudo journalctl -u certbot
```

### Mixed Content Warning

**Problem:** Browser shows mixed content warnings when using SSL.

**Solution:**
1. Update all HTTP links to HTTPS
2. Implement HSTS headers
3. Review application code for hardcoded HTTP links

## General Issues

### Application Won't Start

**Problem:** nginx-love application fails to start.

**Solution:**
1. Check application logs for error messages
2. Verify that all required environment variables are set
3. Ensure all dependencies are installed

```bash
# Check application logs
journalctl -u nginx-love

# Check environment variables
env | grep NGINX_LOVE
```

### Cannot Access Web Interface

**Problem:** Cannot access the nginx-love web interface.

**Solution:**
1. Check that the application is running
2. Verify that the correct port is open
3. Check firewall settings

```bash
# Check if application is listening
netstat -tlnp | grep :3000

# Check firewall settings
sudo ufw status
```

## Getting Help

If you're still experiencing issues after trying these solutions:

1. Check the [nginx-love GitHub repository](https://github.com/nginx-love/nginx-love) for known issues
2. Search the [documentation](/) for more specific information
3. Open an issue on GitHub with details about your problem
4. Join our community forums for additional support