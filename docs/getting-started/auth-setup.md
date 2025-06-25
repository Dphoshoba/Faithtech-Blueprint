# Authentication and User Management Setup

This guide will help you set up and manage authentication in FaithTech Blueprint.

## Authentication Methods

### 1. Email/Password Authentication
```typescript
// Example configuration in .env
AUTH_EMAIL_ENABLED=true
AUTH_EMAIL_VERIFICATION_REQUIRED=true
AUTH_PASSWORD_MIN_LENGTH=8
```

### 2. Social Authentication
```typescript
// Example configuration in .env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
```

## User Roles and Permissions

### Default Roles
1. **Super Admin**
   - Full system access
   - User management
   - System configuration

2. **Organization Admin**
   - Organization management
   - User management within org
   - Resource allocation

3. **Team Lead**
   - Project management
   - Team management
   - Resource requests

4. **Member**
   - Basic access
   - Project participation
   - Resource usage

### Custom Roles
You can create custom roles with specific permissions:
```typescript
// Example role configuration
{
  "roleName": "Project Manager",
  "permissions": [
    "project.create",
    "project.edit",
    "team.manage",
    "resource.allocate"
  ]
}
```

## Security Best Practices

### Password Policy
- Minimum 8 characters
- Must include uppercase and lowercase
- Must include numbers
- Must include special characters
- Password expiration: 90 days

### Session Management
- Session timeout: 30 minutes
- Maximum failed attempts: 5
- Account lockout duration: 15 minutes

### Two-Factor Authentication
1. Enable 2FA in user settings
2. Choose authentication method:
   - SMS
   - Email
   - Authenticator app

## User Management

### Creating Users
1. Go to Admin > Users
2. Click "Add User"
3. Fill in user details
4. Assign role
5. Set permissions

### User Groups
1. Create groups for team organization
2. Assign users to groups
3. Set group permissions
4. Manage group resources

## API Authentication

### JWT Configuration
```typescript
// Example JWT configuration
{
  "jwtSecret": "your-secret-key",
  "jwtExpiration": "24h",
  "jwtRefreshExpiration": "7d"
}
```

### API Key Management
1. Generate API keys
2. Set permissions
3. Monitor usage
4. Rotate keys regularly

## Troubleshooting

### Common Issues
1. **Login Failures**
   - Check credentials
   - Verify account status
   - Check IP restrictions

2. **Permission Issues**
   - Verify role assignments
   - Check group permissions
   - Review resource access

3. **Session Problems**
   - Clear browser cache
   - Check session timeout
   - Verify 2FA status

## Next Steps

- [User Profile Setup](profile-setup.md)
- [Team Management](team-management.md)
- [Resource Access](resource-access.md) 