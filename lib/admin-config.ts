// Admin configuration - In production, use environment variables and proper hashing

export type UserRole = 'super_admin' | 'staff';

export const ADMIN_USERS = [
  {
    email: 'piyamon.p@theconductor',
    // In production, use bcrypt to hash passwords
    password: '1234',
    role: 'super_admin' as UserRole,
    name: 'Piyamon P',
  },
  // Staff users can access internal dashboard but not admin settings
  // Add more staff users here as needed:
  // {
  //   email: 'staff@example.com',
  //   password: 'password123',
  //   role: 'staff' as UserRole,
  //   name: 'Staff Member',
  // },
];

export type AdminUser = {
  email: string;
  role: UserRole;
  name: string;
};

export function validateAdmin(email: string, password: string): AdminUser | null {
  const admin = ADMIN_USERS.find(
    (u) => u.email === email && u.password === password
  );
  
  if (admin) {
    return {
      email: admin.email,
      role: admin.role,
      name: admin.name,
    };
  }
  
  return null;
}

export function isAdmin(email: string): boolean {
  return ADMIN_USERS.some((u) => u.email === email);
}

export function isSuperAdmin(email: string): boolean {
  return ADMIN_USERS.some((u) => u.email === email && u.role === 'super_admin');
}

export function isStaff(email: string): boolean {
  return ADMIN_USERS.some((u) => u.email === email && (u.role === 'staff' || u.role === 'super_admin'));
}

export function canAccessInternal(role: UserRole): boolean {
  return role === 'super_admin' || role === 'staff';
}

export function canAccessAdminSettings(role: UserRole): boolean {
  return role === 'super_admin';
}
