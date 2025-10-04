# User Management Guide

This comprehensive guide covers user management in the Nginx WAF Management Platform, including creating users, managing roles and permissions, configuring Two-Factor Authentication (2FA), and monitoring user activity.

## Overview

The user management system provides:
- **Role-Based Access Control**: Three-tier permission system
- **User Authentication**: Secure login with JWT tokens
- **Two-Factor Authentication**: Enhanced security with 2FA
- **Activity Logging**: Comprehensive audit trail
- **Session Management**: Control active user sessions
- **Password Policies**: Enforce strong password requirements

## User Management Interface

Access user management by clicking **Users** in the sidebar navigation:

![User Management](/reference/screenshots/User_Management.png)

The user management interface provides:
- **User List**: Overview of all system users
- **User Status**: Visual indicators for user status
- **Role Indicators**: User role badges
- **Quick Actions**: Common user management tasks

## User Roles and Permissions

The platform uses a three-tier role-based access control system:

### Administrator (Admin)

**Full System Access** - Complete control over all aspects of the system:

**Domain Management**
- Create, edit, and delete domains
- Configure upstream servers and load balancing
- Manage SSL certificates
- Configure ModSecurity rules

**User Management**
- Create, edit, and delete users
- Assign roles and permissions
- Reset user passwords
- Manage user sessions

**System Configuration**
- Configure system settings
- Manage notification channels
- Set up alert rules
- View system logs and metrics

**Security**
- Configure ACL rules
- Manage WAF settings
- Access security logs
- Configure 2FA settings

### Moderator

**Operational Access** - Manage domains and security settings:

**Domain Management**
- Create, edit, and delete domains
- Configure upstream servers and load balancing
- Manage SSL certificates
- Configure ModSecurity rules

**Security**
- Configure ACL rules
- Manage WAF settings
- Access security logs

**Limited System Access**
- View system metrics and logs
- Manage notification channels
- Set up alert rules

**Restrictions**
- Cannot manage other users
- Cannot modify system settings
- Cannot access user management

### Viewer

**Read-Only Access** - View system status and reports:

**Monitoring**
- View dashboard and metrics
- Check domain status
- View performance reports
- Access log files

**Limited Configuration**
- View but not modify settings
- Export reports and logs
- Check SSL certificate status

**Restrictions**
- Cannot make any configuration changes
- Cannot access user management
- Cannot modify security settings

## Creating Users

### Add a New User

1. Click **Users** in the sidebar
2. Click the **Add User** button
3. Fill in the user details:

**Required Information:**
- **Username**: Unique username (alphanumeric, underscores, hyphens)
- **Email**: Valid email address
- **Full Name**: Display name for the user
- **Role**: Admin, Moderator, or Viewer
- **Password**: Initial password (or auto-generate)
- **Status**: Active or Inactive

**Optional Information:**
- **Phone**: Contact phone number
- **Timezone**: User's timezone (default: Asia/Ho_Chi_Minh)
- **Language**: Interface language (default: en)

### Username Requirements

- **Length**: 3-50 characters
- **Characters**: Letters (a-z, A-Z), numbers (0-9), underscores (_), hyphens (-)
- **Unique**: Must be unique across all users
- **Case-sensitive**: Usernames are case-sensitive

### Password Requirements

- **Minimum Length**: 8 characters
- **Complexity**: Must include:
  - At least one uppercase letter (A-Z)
  - At least one lowercase letter (a-z)
  - At least one number (0-9)
  - At least one special character (!@#$%^&*)
- **Common Passwords**: Cannot use common passwords
- **Personal Information**: Cannot contain username or email

## User Account Management

### Editing User Information

1. Select the user from the list
2. Click the **Edit** button
3. Update the required fields
4. Click **Save** to apply changes

### Changing User Roles

1. Select the user from the list
2. Click the **Edit** button
3. Change the **Role** field
4. Click **Save** to apply changes

⚠️ **Warning**: Changing a user's role will immediately affect their permissions.

### Toggling User Status

Quickly enable or disable user accounts:

1. Select the user from the list
2. Click the **Toggle Status** button
3. Confirm the action

**Status Types:**
- **Active**: User can log in and access the system
- **Inactive**: User cannot log in (account disabled)
- **Suspended**: User account suspended (admin only)

### Resetting User Passwords

1. Select the user from the list
2. Click the **Reset Password** button
3. Choose reset option:
   - **Auto-generate**: System generates a secure password
   - **Manual**: Specify a new password
4. Click **Reset Password**
5. Communicate the new password to the user

### Deleting Users

⚠️ **Warning**: Deleting a user is permanent and cannot be undone.

1. Select the user from the list
2. Click the **Delete** button
3. Confirm the deletion
4. Choose what to do with user data:
   - **Delete**: Remove all user data
   - **Archive**: Archive user data for compliance

## Two-Factor Authentication (2FA)

Two-Factor Authentication adds an extra layer of security by requiring a second form of verification.

### Supported 2FA Methods

#### Time-Based One-Time Password (TOTP)
- **Apps**: Google Authenticator, Authy, Microsoft Authenticator
- **Setup**: QR code or manual entry
- **Backup Codes**: Generated for recovery

#### Email-Based 2FA
- **Method**: One-time code sent to email
- **Expiration**: Codes expire after 10 minutes
- **Rate Limiting**: Prevents email flooding

### Setting Up 2FA for Users

#### User Self-Setup

1. Log in to the user account
2. Navigate to **Profile** settings
3. Click **Enable 2FA**
4. Choose 2FA method (TOTP recommended)
5. Follow the setup instructions:
   - Scan QR code with authenticator app
   - Enter verification code
   - Save backup codes securely

#### Admin-Forced 2FA

Administrators can require 2FA for specific users:

1. Select the user from the list
2. Click **Edit** button
3. Enable **Require 2FA**
4. Choose grace period for setup
5. Click **Save**

### Managing 2FA

#### Disable 2FA

1. Select the user from the list
2. Click **Edit** button
3. Disable **Require 2FA**
4. Click **Save**

#### Regenerate Backup Codes

1. Select the user from the list
2. Click **Manage 2FA**
3. Click **Regenerate Backup Codes**
4. Securely communicate new codes to user

#### Reset 2FA

If a user loses access to their 2FA device:

1. Select the user from the list
2. Click **Reset 2FA**
3. Confirm the reset
4. User will need to set up 2FA again on next login

## Session Management

Monitor and control active user sessions for security.

### Viewing Active Sessions

1. Select a user from the list
2. Click **View Sessions**
3. See active sessions with details:
   - **Session ID**: Unique session identifier
   - **IP Address**: Login IP address
   - **Device**: Device type and browser
   - **Location**: Geographic location (if available)
   - **Last Active**: Last activity timestamp
   - **Expires**: Session expiration time

### Revoking Sessions

1. Select the user from the list
2. Click **View Sessions**
3. Select the session to revoke
4. Click **Revoke Session**
5. Confirm the action

### Force Logout

Immediately log out a user from all devices:

1. Select the user from the list
2. Click **Force Logout**
3. Confirm the action
4. User will need to log in again

## Activity Monitoring

Track user activity for security and compliance.

### Viewing Activity Logs

1. Select a user from the list
2. Click **View Activity**
3. Filter activities by:
   - **Date Range**: Custom date range
   - **Activity Type**: Login, logout, configuration changes
   - **Success Status**: Successful or failed actions
   - **IP Address**: Filter by specific IP

### Activity Types

- **Login**: User login attempts
- **Logout**: User logout actions
- **Config Change**: Configuration modifications
- **User Action**: User management actions
- **Security**: Security-related events

### Monitoring Security Events

Pay special attention to:

- **Failed Login Attempts**: Potential brute force attacks
- **Multiple IPs**: Potential account sharing
- **Unusual Activity**: Actions outside normal patterns
- **Privilege Escalation**: Role changes or permission modifications

## User Statistics

Monitor user activity and system usage through statistics.

### User Statistics Dashboard

Access user statistics by clicking **Users** and then **Statistics**:

**User Overview**
- Total users by role
- Active vs inactive users
- 2FA adoption rate
- Recent activity trends

**Login Statistics**
- Daily/weekly/monthly login counts
- Failed login attempts
- Geographic distribution
- Device and browser statistics

**Activity Statistics**
- Configuration changes by user
- Most active users
- Feature usage patterns
- Time-based activity analysis

## Best Practices

### User Management

1. **Principle of Least Privilege**: Assign minimum necessary permissions
2. **Regular Reviews**: Periodically review user roles and permissions
3. **Account Cleanup**: Remove inactive or unused accounts
4. **Strong Passwords**: Enforce strong password policies

### Security

1. **Enable 2FA**: Require 2FA for all admin and moderator accounts
2. **Monitor Activity**: Regularly review user activity logs
3. **Session Management**: Monitor and manage active sessions
4. **Failed Login Tracking**: Monitor for suspicious login attempts

### Compliance

1. **Audit Trail**: Maintain complete audit logs
2. **Data Retention**: Follow data retention policies
3. **Access Controls**: Implement proper access controls
4. **Regular Audits**: Conduct regular security audits

## API Integration

For programmatic user management, use the REST API:

### List Users
```bash
curl -X GET http://localhost:3001/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create User
```bash
curl -X POST http://localhost:3001/api/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "newuser@example.com",
    "fullName": "New User",
    "role": "moderator",
    "password": "SecurePassword123!",
    "status": "active"
  }'
```

### Update User
```bash
curl -X PUT http://localhost:3001/api/users/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Updated Name",
    "email": "updated@example.com",
    "role": "admin"
  }'
```

### Delete User
```bash
curl -X DELETE http://localhost:3001/api/users/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Reset Password
```bash
curl -X POST http://localhost:3001/api/users/USER_ID/reset-password \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newPassword": "NewSecurePassword123!"
  }'
```

### Toggle User Status
```bash
curl -X PATCH http://localhost:3001/api/users/USER_ID/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "inactive"
  }'
```

## Troubleshooting

### Common User Issues

#### Login Failures

**Symptoms**: User cannot log in with correct credentials

**Possible Causes**:
- Account is inactive or suspended
- Password expired or changed
- 2FA verification failing
- Account locked due to failed attempts

**Solutions**:
1. Check user status in user management
2. Reset user password
3. Reset 2FA if needed
4. Check for account lockout

#### Permission Issues

**Symptoms**: User cannot access expected features

**Possible Causes**:
- Incorrect role assignment
- Role permissions changed
- User account issues

**Solutions**:
1. Verify user role assignment
2. Check role permissions
3. Review user account status
4. Check activity logs for changes

#### 2FA Issues

**Symptoms**: User cannot complete 2FA verification

**Possible Causes**:
- Time sync issues with authenticator app
- Lost authenticator device
- Backup codes lost

**Solutions**:
1. Check device time synchronization
2. Reset 2FA for the user
3. Generate new backup codes
4. Use alternative 2FA method

### Security Incidents

#### Suspicious Activity

If you detect suspicious user activity:

1. **Immediate Actions**:
   - Force logout of suspicious user
   - Reset user password
   - Revoke all active sessions

2. **Investigation**:
   - Review activity logs
   - Check login IP addresses
   - Verify configuration changes

3. **Prevention**:
   - Enable 2FA if not already enabled
   - Review and tighten permissions
   - Implement additional monitoring

## Conclusion

User management is critical for maintaining system security and proper access controls. By following this guide, you should be able to:

- Create and manage user accounts effectively
- Implement proper role-based access control
- Configure Two-Factor Authentication for enhanced security
- Monitor user activity and manage sessions
- Troubleshoot common user issues

For more information on related topics:
- [Domain Management](/guide/domains)
- [SSL Certificate Management](/guide/ssl)
- [ModSecurity WAF Configuration](/guide/modsecurity)
- [Log Analysis](/guide/logs)