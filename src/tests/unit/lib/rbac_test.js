import { describe, it, expect, vi, beforeEach } from 'vitest';

const prisma = {
  userRole: { findMany: vi.fn() },
  userPermissionOverride: { findMany: vi.fn() },
};
vi.mock('@/lib/db.js', () => ({ prisma }));

let rbac;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  rbac = await import('@/lib/rbac.js');
});

describe('lib/rbac', () => {
  it('getPermSet: merges role permissions + overrides (grant/remove)', async () => {
    prisma.userRole.findMany.mockResolvedValue([
      {
        role: {
          role_permissions: [{ permission: { resource: 'Users', action: 'Read' } }, { permission: { resource: 'Users', action: 'Write' } }],
        },
      },
    ]);

    prisma.userPermissionOverride.findMany.mockResolvedValue([
      { grant: false, permission: { resource: 'Users', action: 'Read' } },
      { grant: true, permission: { resource: 'Reports', action: 'View' } },
    ]);

    const set = await rbac.getPermSet('u1');

    expect(set.has('users:read')).toBe(false);
    expect(set.has('users:write')).toBe(true);
    expect(set.has('reports:view')).toBe(true);
  });

  it('getPermSet: caches within TTL', async () => {
    const nowSpy = vi.spyOn(Date, 'now');

    prisma.userRole.findMany.mockResolvedValue([]);
    prisma.userPermissionOverride.findMany.mockResolvedValue([]);

    nowSpy.mockReturnValue(0);
    await rbac.getPermSet('u1');
    await rbac.getPermSet('u1');

    expect(prisma.userRole.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.userPermissionOverride.findMany).toHaveBeenCalledTimes(1);

    nowSpy.mockReturnValue(61_000);
    await rbac.getPermSet('u1');

    expect(prisma.userRole.findMany).toHaveBeenCalledTimes(2);
    expect(prisma.userPermissionOverride.findMany).toHaveBeenCalledTimes(2);

    nowSpy.mockRestore();
  });

  it('canFromClaims: matches normalized key', () => {
    expect(rbac.canFromClaims(['users:read'], 'Users', 'Read')).toBe(true);
    expect(rbac.canFromClaims(['users:read'], 'Users', 'Write')).toBe(false);
  });
});
