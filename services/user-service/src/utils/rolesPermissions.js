// Central roles and permissions definition
const rolePermissions = {
  admin: [
    'manage_users',
    'manage_organizations',
    'manage_subscriptions',
    'view_analytics',
    'manage_content'
  ],
  organization_admin: [
    'manage_organization_users',
    'manage_organization_subscriptions',
    'view_organization_analytics',
    'manage_organization_content'
  ],
  user: [
    'view_profile',
    'edit_profile',
    'view_organization'
  ]
};

module.exports = {
  rolePermissions
}; 