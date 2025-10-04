# ModSecurity WAF Guide

This comprehensive guide covers ModSecurity Web Application Firewall (WAF) configuration in the Nginx WAF Management Platform, including OWASP Core Rule Set (CRS) management, custom rule creation, and advanced security configurations.

## Overview

ModSecurity is a web application firewall that protects your web applications from various attacks, including:

- **SQL Injection (SQLi)**: Prevents database injection attacks
- **Cross-Site Scripting (XSS)**: Blocks malicious script injection
- **Remote File Inclusion (RFI)**: Prevents inclusion of remote files
- **Local File Inclusion (LFI)**: Blocks local file access attempts
- **Command Injection**: Prevents system command execution
- **Session Fixation**: Protects against session hijacking
- **Authentication Bypass**: Blocks unauthorized access attempts

## ModSecurity Interface

Access ModSecurity settings by:
1. Click **Domains** in the sidebar
2. Select a domain from the list
3. Click the **ModSecurity** tab

![ModSecurity](/reference/screenshots/modsecurity.png)

The ModSecurity interface provides:
- **Global Settings**: Enable/disable ModSecurity globally
- **CRS Rules**: OWASP Core Rule Set management
- **Custom Rules**: User-defined security rules
- **Rule Categories**: Organized rule categories
- **Paranoia Levels**: Security sensitivity settings

## Enabling ModSecurity

### Global ModSecurity Settings

1. Click **ModSecurity** in the sidebar
2. Configure global settings:
   - **Enable ModSecurity**: Turn on WAF protection
   - **Default Paranoia Level**: Set default security level
   - **Audit Logging**: Enable/disable security event logging

### Domain-Specific ModSecurity

1. Select a domain from the list
2. Click the **ModSecurity** tab
3. Toggle **Enable ModSecurity** for this domain
4. Configure domain-specific settings

## OWASP Core Rule Set (CRS)

The OWASP CRS is a set of generic attack detection rules that provide protection against many common attack categories.

### CRS Rule Categories

#### 1. Request Rule Set
- **REQUEST-910-IP-REPUTATION**: IP reputation blocking
- **REQUEST-911-METHOD-ENFORCEMENT**: HTTP method enforcement
- **REQUEST-912-DOS-PROTECTION**: Denial of service protection
- **REQUEST-913-SCANNER-DETECTION**: Web scanner detection
- **REQUEST-920-PROTOCOL-ENFORCEMENT**: Protocol validation
- **REQUEST-921-PROTOCOL-ATTACK**: Protocol attack detection
- **REQUEST-930-APPLICATION-ATTACK-LFI**: Local file inclusion attacks
- **REQUEST-931-APPLICATION-ATTACK-RFI**: Remote file inclusion attacks
- **REQUEST-932-APPLICATION-ATTACK-RCE**: Remote code execution attacks
- **REQUEST-933-APPLICATION-ATTACK-PHP**: PHP injection attacks
- **REQUEST-934-APPLICATION-ATTACK-NODEJS**: Node.js injection attacks
- **REQUEST-941-APPLICATION-ATTACK-XSS**: Cross-site scripting attacks
- **REQUEST-942-APPLICATION-ATTACK-SQLI**: SQL injection attacks
- **REQUEST-943-APPLICATION-ATTACK-SESSION-FIXATION**: Session fixation attacks
- **REQUEST-944-APPLICATION-ATTACK-JAVA**: Java injection attacks
- **REQUEST-949-BLOCKING-EVALUATION**: Rule evaluation and blocking

#### 2. Response Rule Set
- **RESPONSE-950-DATA-LEAKAGES**: Data leakage detection
- **RESPONSE-951-DATA-LEAKAGES-SQL**: SQL error message detection
- **RESPONSE-952-DATA-LEAKAGES-JAVA**: Java error message detection
- **RESPONSE-953-DATA-LEAKAGES-PHP**: PHP error message detection
- **RESPONSE-954-DATA-LEAKAGES-IIS**: IIS error message detection
- **RESPONSE-959-BLOCKING-EVALUATION**: Response blocking evaluation

### Managing CRS Rules

#### Enable/Disable Rule Categories

1. Select your domain
2. Click the **ModSecurity** tab
3. View available rule categories
4. Toggle categories on/off as needed

#### Configure Individual Rules

1. Click on a rule category to expand it
2. View individual rules within the category
3. Toggle specific rules on/off
4. Configure rule-specific settings

### Paranoia Levels

Paranoia levels determine the sensitivity of the WAF rules:

#### Level 1 (Default)
- **Description**: Basic protection with minimal false positives
- **Use Case**: Production environments with standard applications
- **Rules**: Core protection rules only
- **False Positives**: Very low

#### Level 2
- **Description**: Enhanced protection with some false positives possible
- **Use Case**: Production environments requiring higher security
- **Rules**: All Level 1 rules + additional detection rules
- **False Positives**: Low

#### Level 3
- **Description**: High security with more false positives
- **Use Case**: High-security environments or sensitive applications
- **Rules**: All Level 2 rules + aggressive detection rules
- **False Positives**: Medium

#### Level 4
- **Description**: Maximum security with many false positives
- **Use Case**: High-risk environments or testing
- **Rules**: All Level 3 rules + experimental rules
- **False Positives**: High

### Configuring Paranoia Levels

1. Select your domain
2. Click the **ModSecurity** tab
3. Choose the appropriate paranoia level
4. Click **Save**

⚠️ **Warning**: Higher paranoia levels may block legitimate traffic. Test thoroughly before deploying in production.

## Custom Rules

Create custom ModSecurity rules for application-specific security requirements.

### Rule Syntax

ModSecurity rules follow this syntax:
```modsecurity
SecRule VARIABLES OPERATOR [ACTIONS]
```

#### Example Custom Rules

#### Block SQL Injection Attempts
```modsecurity
SecRule ARGS "@detectSQLi" \
    "id:1001,\
    phase:2,\
    block,\
    msg:'SQL Injection Attack Detected',\
    logdata:'Matched Data: %{MATCHED_VAR} found within %{MATCHED_VAR_NAME}',\
    tag:'application-multi',\
    tag:'language-multi',\
    tag:'platform-multi',\
    tag:'attack-sqli'"
```

#### Block XSS Attempts
```modsecurity
SecRule ARGS "@detectXSS" \
    "id:1002,\
    phase:2,\
    block,\
    msg:'XSS Attack Detected',\
    logdata:'Matched Data: %{MATCHED_VAR} found within %{MATCHED_VAR_NAME}',\
    tag:'application-multi',\
    tag:'language-multi',\
    tag:'platform-multi',\
    tag:'attack-xss'"
```

#### Block Bad User Agents
```modsecurity
SecRule REQUEST_HEADERS:User-Agent "@pmFromFile bad-user-agents.data" \
    "id:1003,\
    phase:1,\
    block,\
    msg:'Bad User Agent Blocked',\
    logdata:'Matched Data: %{MATCHED_VAR} found within %{MATCHED_VAR_NAME}',\
    tag:'application-multi',\
    tag:'language-multi',\
    tag:'platform-multi',\
    tag:'attack-useragent'"
```

#### Rate Limiting
```modsecurity
SecRule IP:@ipMatch "192.168.1.0/24" \
    "id:1004,\
    phase:1,\
    nolog,\
    pass,\
    ctl:ruleEngine=Off"
```

### Creating Custom Rules

1. Select your domain
2. Click the **ModSecurity** tab
3. Click **Add Custom Rule**
4. Fill in rule details:
   - **Name**: Descriptive rule name
   - **Category**: Rule category (e.g., "Custom Security")
   - **Rule Content**: ModSecurity rule syntax
   - **Description**: What the rule does
   - **Enabled**: Enable/disable the rule

5. Click **Save**

### Rule Variables

ModSecurity provides various variables for rule matching:

#### Request Variables
- `ARGS`: All request parameters
- `ARGS_NAMES`: Parameter names
- `ARGS_GET`: GET parameters
- `ARGS_POST`: POST parameters
- `REQUEST_HEADERS`: Request headers
- `REQUEST_COOKIES`: Request cookies
- `REQUEST_URI`: Request URI
- `REQUEST_METHOD`: HTTP method
- `REQUEST_BODY`: Request body

#### Response Variables
- `RESPONSE_HEADERS`: Response headers
- `RESPONSE_BODY`: Response body
- `RESPONSE_STATUS`: HTTP status code

### Operators

ModSecurity provides various operators for pattern matching:

#### String Operators
- `@rx`: Regular expression match
- `@pm`: Phrase match (any of the phrases)
- `@pmFromFile`: Phrase match from file
- `@contains`: Contains string
- `@beginsWith`: Begins with string
- `@endsWith`: Ends with string

#### Numeric Operators
- `@eq`: Equal to
- `@gt`: Greater than
- `@lt`: Less than
- `@ge`: Greater than or equal to
- `@le`: Less than or equal to

#### Special Operators
- `@detectSQLi`: SQL injection detection
- `@detectXSS`: XSS detection
- `@validateUtf8Encoding`: UTF-8 validation
- `@validateByteRange`: Byte range validation

## Rule Actions

ModSecurity supports various actions for rule processing:

### Disruptive Actions
- **deny**: Deny the request with a 403 status
- **block**: Block the request (depends on configuration)
- **drop**: Drop the connection
- **redirect**: Redirect to another URL
- **pass**: Continue processing (no action)

### Flow Actions
- **phase**: Set processing phase (1-5)
- **t:none**: No transformation
- **t:lowercase`: Convert to lowercase
- **t:urlDecode`: URL decode
- **t:htmlEntityDecode`: HTML entity decode

### Data Actions
- **log**: Log the rule match
- **nolog**: Do not log the rule match
- **auditlog**: Write to audit log
- **noauditlog**: Do not write to audit log

### Metadata Actions
- **id**: Unique rule identifier
- **msg**: Rule message
- **logdata**: Additional log data
- **tag**: Rule tags
- **severity**: Rule severity (1-5)

## Advanced Configuration

### Exception Handling

Create exceptions for legitimate traffic that might be blocked:

#### IP Whitelist
```modsecurity
SecRule REMOTE_ADDR "@ipMatch 192.168.1.100" \
    "id:2001,\
    phase:1,\
    nolog,\
    pass,\
    ctl:ruleEngine=Off"
```

#### URI Whitelist
```modsecurity
SecRule REQUEST_URI "@beginsWith /api/public/" \
    "id:2002,\
    phase:1,\
    nolog,\
    pass,\
    ctl:ruleRemoveById 941100"
```

#### Parameter Whitelist
```modsecurity
SecRule ARGS:product_code "@rx ^[A-Z0-9-]+$" \
    "id:2003,\
    phase:2,\
    nolog,\
    pass,\
    ctl:ruleRemoveTargetById 942100;ARGS:product_code"
```

### Anomaly Scoring

Configure anomaly scoring for advanced threat detection:

```modsecurity
# Set anomaly score threshold
SecAction "id:9001,\
    phase:1,\
    nolog,\
    pass,\
    t:none,\
    setvar:tx.anomaly_score_threshold=5"

# Increase anomaly score for suspicious requests
SecRule ARGS "@detectSQLi" \
    "id:9002,\
    phase:2,\
    pass,\
    msg:'SQL Injection Attempt',\
    logdata:'Matched Data: %{MATCHED_VAR} found within %{MATCHED_VAR_NAME}',\
    tag:'attack-sqli',\
    setvar:tx.anomaly_score=+3"

# Block high anomaly scores
SecRule TX:ANOMALY_SCORE "@gt %{tx.anomaly_score_threshold}" \
    "id:9003,\
    phase:2,\
    block,\
    msg:'Anomaly Score Exceeded'"
```

## Monitoring and Logging

### ModSecurity Logs

Monitor ModSecurity activity through the system logs:

1. Click **Logs** in the sidebar
2. Filter by **ModSecurity** log type
3. View security events and blocked requests

### Audit Log Configuration

Configure audit logging for detailed security analysis:

1. Select your domain
2. Click the **ModSecurity** tab
3. Configure audit logging settings:
   - **Enable Audit Log**: Turn on detailed logging
   - **Log Parts**: Select which parts to log (A, B, C, D, E, F, G, H, I, J, K, Z)
   - **Relevant Only**: Log only relevant requests

### Log Parts

- **A**: Audit log header
- **B**: Request headers
- **C**: Request body
- **D**: Reserved for intermediary response headers
- **E**: Intermediary response body
- **F**: Final response headers
- **G**: Final response body
- **H**: Audit log trailer
- **I**: Request bytes (minus)
- **J**: Response bytes (minus)
- **K**: Final boundary
- **Z**: Final boundary

## Performance Considerations

### Rule Optimization

Optimize ModSecurity rules for better performance:

1. **Use Specific Variables**: Target specific variables instead of generic ones
2. **Order Rules Efficiently**: Place most common rules first
3. **Use Appropriate Operators**: Choose the most efficient operator for the task
4. **Limit Rule Scope**: Apply rules only where needed

### Performance Tuning

Configure ModSecurity for optimal performance:

```nginx
# ModSecurity configuration
modsecurity on;
modsecurity_rules_file /etc/nginx/modsec/main.conf;

# Performance settings
SecRuleEngine On
SecAuditEngine RelevantOnly
SecAuditLogRelevantStatus "^(?:5|4(?!04))"
SecAuditLogParts ABIJDEFHZ
SecAuditLog /var/log/modsec_audit.log

# Connection settings
SecConnReadStateLimit 100
SecConnWriteStateLimit 100
```

## Troubleshooting

### Common Issues

#### False Positives

**Symptoms**: Legitimate requests are being blocked

**Solutions**:
1. Identify the blocking rule from logs
2. Create an exception rule
3. Adjust paranoia level
4. Fine-tune specific rules

#### Performance Issues

**Symptoms**: Slow response times, high CPU usage

**Solutions**:
1. Optimize rule order
2. Use more specific variables
3. Disable unnecessary rules
4. Enable rule caching

#### Rule Conflicts

**Symptoms**: Rules not working as expected

**Solutions**:
1. Check rule IDs for conflicts
2. Verify rule execution phases
3. Review rule execution order
4. Test rules individually

### Debug Mode

Enable ModSecurity debug mode for detailed logging:

1. Go to **System** settings
2. Enable **ModSecurity Debug Mode**
3. Set debug log level (0-9)
4. Check debug logs in **Logs** section
5. Disable debug mode when finished

### Testing Rules

Test ModSecurity rules before deployment:

```bash
# Test rule syntax
modsec-rules-check /etc/nginx/modsec/custom_rules.conf

# Test with curl
curl -X POST http://example.com/ \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "param=test' OR 1=1--"
```

## Best Practices

### Rule Management

1. **Use Unique IDs**: Ensure each rule has a unique ID
2. **Document Rules**: Add clear descriptions and tags
3. **Version Control**: Keep rules under version control
4. **Regular Updates**: Update CRS rules regularly

### Security

1. **Defense in Depth**: Use multiple layers of security
2. **Regular Testing**: Test rules in staging before production
3. **Monitor Logs**: Regularly review security logs
4. **Update Signatures**: Keep attack signatures updated

### Performance

1. **Optimize Rules**: Keep rules efficient and targeted
2. **Monitor Performance**: Track WAF performance impact
3. **Use Caching**: Enable rule caching where possible
4. **Regular Maintenance**: Remove unused or redundant rules

## API Integration

For programmatic ModSecurity management, use the REST API:

### List CRS Rules
```bash
curl -X GET http://localhost:3001/api/modsec/crs-rules \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Toggle CRS Rule
```bash
curl -X PATCH http://localhost:3001/api/modsec/crs/rules/RULE_FILE/toggle \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": false
  }'
```

### List Custom Rules
```bash
curl -X GET http://localhost:3001/api/modsec/rules \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Custom Rule
```bash
curl -X POST http://localhost:3001/api/modsec/rules \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Block SQL Injection",
    "category": "Security",
    "ruleContent": "SecRule ARGS \"@detectSQLi\" \"id:1001,phase:2,block,msg:\"SQL Injection Attack Detected\"\"",
    "description": "Blocks SQL injection attempts",
    "enabled": true
  }'
```

### Update Custom Rule
```bash
curl -X PUT http://localhost:3001/api/modsec/rules/RULE_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Block SQL Injection",
    "category": "Security",
    "ruleContent": "SecRule ARGS \"@detectSQLi\" \"id:1001,phase:2,block,msg:\"SQL Injection Attack Detected\"\"",
    "description": "Blocks SQL injection attempts",
    "enabled": false
  }'
```

### Delete Custom Rule
```bash
curl -X DELETE http://localhost:3001/api/modsec/rules/RULE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

For complete API documentation, see the [API Reference](/api/modsecurity).

## Conclusion

ModSecurity WAF is a powerful tool for protecting your web applications. By following this guide, you should be able to:

- Configure ModSecurity for optimal protection
- Manage OWASP CRS rules effectively
- Create custom security rules
- Monitor and analyze security events
- Troubleshoot common WAF issues

For more information on related topics:
- [Domain Management](/guide/domains)
- [SSL Certificate Management](/guide/ssl)
- [Log Analysis](/guide/logs)
- [Performance Monitoring](/guide/performance)