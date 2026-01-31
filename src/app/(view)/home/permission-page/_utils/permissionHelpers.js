// src/app/(view)/home/permission-page/_utils/permissionHelpers.js
export function titleize(value) {
  return String(value || '')
    .trim()
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function formatRoleLabel(role) {
  return titleize(role?.name || '');
}

export function formatUserLabel(user) {
  if (!user) return '';
  const name = user.name ? titleize(user.name) : '';
  const email = user.email ? String(user.email).trim() : '';
  if (name && email) return `${name} (${email})`;
  return name || email || 'User';
}
