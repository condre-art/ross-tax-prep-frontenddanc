// roles.js
// Simple role/permission check for portal pages

// Pyramid hierarchy roles for IRS/Drake workflows:
// 'admin' (superuser, all access)
// 'ero' (Electronic Return Originator, efile, compliance, bank products)
// 'bookkeeper' (bookkeeping tools, entity management)
// 'staff' (general staff, limited access)
// 'client' (portal access, view own data)
// Add more as needed: 'trust', 'ccorp', 'scorp', 'llc', 'selfemployed'

// Permissions mapping (example)
const rolePermissions = {
  admin: [
    'manage_users', 'view_all', 'efile', 'compliance', 'bank_products', 'assign_tasks', 'bookkeeping', 'settings'
  ],
  ero: [
    'efile', 'compliance', 'bank_products', 'assign_tasks', 'view_clients'
  ],
  bookkeeper: [
    'bookkeeping', 'view_entities', 'manage_entities'
  ],
  staff: [
    'view_clients', 'assist_efile', 'basic_bookkeeping'
  ],
  client: [
    'view_own', 'upload_docs', 'message_staff'
  ],
  trust: ['view_own', 'bookkeeping'],
  ccorp: ['view_own', 'bookkeeping'],
  scorp: ['view_own', 'bookkeeping'],
  llc: ['view_own', 'bookkeeping'],
  selfemployed: ['view_own', 'bookkeeping']
};


function getUserRole() {
  // In real use, get from session/cookie/JWT
  return sessionStorage.getItem('userRole');
}

function getUserPermissions(role) {
  return rolePermissions[role] || [];
}


function requireRole(allowedRoles) {
  const role = getUserRole();
  if (!role || !allowedRoles.includes(role)) {
    window.location.href = '/portal/login.html'; // redirect to login if not allowed
  }
}

function requirePermission(permission) {
  const role = getUserRole();
  const permissions = getUserPermissions(role);
  if (!permissions.includes(permission)) {
    window.location.href = '/portal/login.html'; // redirect to login if not allowed
  }
}


// Usage example (put at top of protected pages):
// requireRole(['client']); // Only clients can access
// requireRole(['staff', 'admin']); // Only staff or admin
// requireRole(['ero']); // Only EROs can access
// requirePermission('efile'); // Only roles with efile permission


// To set role after login (example):
// sessionStorage.setItem('userRole', 'client');

export { getUserRole, requireRole, getUserPermissions, requirePermission };