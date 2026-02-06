// ERO password validation (for demo, use secure backend in production)
function validateEroLogin(email, password) {
  const eroEmails = [
    'admin@rosstaxprepandbookkeeping.com',
    'info@rosstaxprepandbookkeeping.com'
  ];
  const eroPassword = 'ero2026!';
  return eroEmails.includes(email) && password === eroPassword;
}

export { getUserRole, requireRole, setTempPassword, validateTempPassword, clearTempPassword, validateEroLogin };
// scripts/portal-auth.js
// Simple role-based access control for portal pages

// Example roles: 'client', 'staff', 'admin', 'ero', 'bookkeeper'
// In a real app, get this from backend/session/JWT

function getUserRole() {
  // For demo: read from localStorage (replace with real auth)
  return localStorage.getItem('userRole');
}

// Temp password logic for admin/ERO
function setTempPassword(email, tempPassword) {
  // Store temp password for user (demo: localStorage, replace with backend)
  localStorage.setItem('tempPassword_' + email, tempPassword);
}

function validateTempPassword(email, inputPassword) {
  const stored = localStorage.getItem('tempPassword_' + email);
  return stored && stored === inputPassword;
}

function clearTempPassword(email) {
  localStorage.removeItem('tempPassword_' + email);
}

function requireRole(allowedRoles) {
  const role = getUserRole();
  if (!role || !allowedRoles.includes(role)) {
    // Not logged in or not allowed
    window.location.href = '/portal/login.html';
  }
}

// Example usage for each portal page:
// On messages.html, only allow 'client' and 'staff'
// requireRole(['client', 'staff']);
// On admin-only pages:
// requireRole(['admin']);


// To set role after login (replace with real backend logic):
// localStorage.setItem('userRole', 'client');
// For admin/ERO temp password assignment:
// setTempPassword('admin@rosstaxprepandbookkeeping.com', 'TEMP1234');
// validateTempPassword('admin@rosstaxprepandbookkeeping.com', 'TEMP1234');
// clearTempPassword('admin@rosstaxprepandbookkeeping.com');


// To log out:
// localStorage.removeItem('userRole');

export { getUserRole, requireRole, setTempPassword, validateTempPassword, clearTempPassword };
