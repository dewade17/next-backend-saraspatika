import { describe, it, expect, vi, beforeEach } from 'vitest';

const repo = {
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
  createUserWithRole: vi.fn(),
  createPasswordResetToken: vi.fn(),
  findLatestValidResetToken: vi.fn(),
  consumeResetTokenAndUpdatePassword: vi.fn(),
};
vi.mock('@/repositories/auth/auth_repo.js', () => repo);

const rbac = { getPermSet: vi.fn() };
vi.mock('@/lib/rbac.js', () => rbac);

const jwt = { issueAccessToken: vi.fn() };
vi.mock('@/lib/jwt.js', () => jwt);

const mail = { sendResetCode: vi.fn() };
vi.mock('@/lib/mail.js', () => mail);

const crypto = { hashPassword: vi.fn(), verifyPassword: vi.fn(), sixDigit: vi.fn() };
vi.mock('@/lib/crypto.js', () => crypto);

const bcryptMock = { hash: vi.fn(), compare: vi.fn() };
vi.mock('bcryptjs', () => ({ default: bcryptMock }));

let svc;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();

  crypto.hashPassword.mockResolvedValue('hash_pw');
  crypto.verifyPassword.mockResolvedValue(true);
  crypto.sixDigit.mockReturnValue('123456');

  jwt.issueAccessToken.mockResolvedValue('jwt.token');
  rbac.getPermSet.mockResolvedValue(new Set(['users:read']));

  bcryptMock.hash.mockResolvedValue('code_hash');
  bcryptMock.compare.mockResolvedValue(true);

  svc = await import('@/services/auth/auth_service.js');
});

describe('auth_service', () => {
  it('register: default role GURU, email normalized, autoLogin issues token', async () => {
    repo.findUserByEmail.mockResolvedValue(null);
    repo.createUserWithRole.mockResolvedValue({
      user: { id_user: 'u1', email: 'user@example.com', name: 'N', role: 'GURU' },
    });

    const res = await svc.register({
      name: 'N',
      email: '  USER@EXAMPLE.COM ',
      password: '12345678',
      role_name: 'INVALID',
      autoLogin: true,
    });

    expect(repo.createUserWithRole).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@example.com',
        role_name: 'GURU',
        password_hash: 'hash_pw',
      }),
    );
    expect(jwt.issueAccessToken).toHaveBeenCalled();
    expect(res.role_assigned).toBe('GURU');
    expect(res.token).toBe('jwt.token');
  });

  it('register: self role allowed (PEGAWAI)', async () => {
    repo.findUserByEmail.mockResolvedValue(null);
    repo.createUserWithRole.mockResolvedValue({
      user: { id_user: 'u1', email: 'a@b.com', name: 'N', role: 'PEGAWAI' },
    });

    const res = await svc.register({
      name: 'N',
      email: 'a@b.com',
      password: '12345678',
      role_name: 'pegawai',
      autoLogin: false,
    });

    expect(res.role_assigned).toBe('PEGAWAI');
    expect(res.token).toBe(null);
    expect(jwt.issueAccessToken).not.toHaveBeenCalled();
  });

  it('register: conflict when email already exists', async () => {
    repo.findUserByEmail.mockResolvedValue({ id_user: 'u_exist' });

    await expect(svc.register({ name: 'N', email: 'a@b.com', password: '12345678' })).rejects.toMatchObject({ status: 409, code: 'email_taken' });
  });

  it('login: unauthorized when user not found', async () => {
    repo.findUserByEmail.mockResolvedValue(null);

    await expect(svc.login({ email: 'a@b.com', password: 'x' })).rejects.toMatchObject({
      status: 401,
      code: 'invalid_credentials',
    });
  });

  it('login: unauthorized when password mismatch', async () => {
    repo.findUserByEmail.mockResolvedValue({ id_user: 'u1', email: 'a@b.com', password_hash: 'h' });
    crypto.verifyPassword.mockResolvedValue(false);

    await expect(svc.login({ email: 'a@b.com', password: 'x' })).rejects.toMatchObject({
      status: 401,
      code: 'invalid_credentials',
    });
  });

  it('login: returns token when ok', async () => {
    repo.findUserByEmail.mockResolvedValue({ id_user: 'u1', email: 'a@b.com', password_hash: 'h' });
    const res = await svc.login({ email: 'a@b.com', password: 'x' });

    expect(jwt.issueAccessToken).toHaveBeenCalledWith(expect.objectContaining({ sub: 'u1', email: 'a@b.com' }), '20m');
    expect(res.token).toBe('jwt.token');
  });

  it('requestResetToken: returns ok even if user not found (no enumeration)', async () => {
    repo.findUserByEmail.mockResolvedValue(null);

    const res = await svc.requestResetToken({ email: 'missing@b.com' });
    expect(res).toEqual({ ok: true });
    expect(repo.createPasswordResetToken).not.toHaveBeenCalled();
    expect(mail.sendResetCode).not.toHaveBeenCalled();
  });

  it('requestResetToken: creates token + sends email', async () => {
    repo.findUserByEmail.mockResolvedValue({ id_user: 'u1', email: 'a@b.com' });

    const before = Date.now();
    await svc.requestResetToken({ email: 'A@B.COM' });

    expect(crypto.sixDigit).toHaveBeenCalled();
    expect(bcryptMock.hash).toHaveBeenCalledWith('123456', 12);

    expect(repo.createPasswordResetToken).toHaveBeenCalledWith(
      expect.objectContaining({
        id_user: 'u1',
        code_hash: 'code_hash',
        expires_at: expect.any(Date),
      }),
    );

    const call = repo.createPasswordResetToken.mock.calls[0][0];
    const expiresMs = call.expires_at.getTime() - before;
    expect(expiresMs).toBeGreaterThanOrEqual(9 * 60 * 1000);
    expect(expiresMs).toBeLessThanOrEqual(11 * 60 * 1000);

    expect(mail.sendResetCode).toHaveBeenCalledWith('a@b.com', '123456');
  });

  it('resetPassword: returns ok even if user not found (no enumeration)', async () => {
    repo.findUserByEmail.mockResolvedValue(null);

    const res = await svc.resetPassword({ email: 'x@b.com', code: '123456', newPassword: '12345678' });
    expect(res).toEqual({ ok: true });
  });

  it('resetPassword: badRequest if no valid token', async () => {
    repo.findUserByEmail.mockResolvedValue({ id_user: 'u1', email: 'a@b.com' });
    repo.findLatestValidResetToken.mockResolvedValue(null);

    await expect(svc.resetPassword({ email: 'a@b.com', code: '123456', newPassword: '12345678' })).rejects.toMatchObject({ status: 400, code: 'invalid_code' });
  });

  it('resetPassword: badRequest if code mismatch', async () => {
    repo.findUserByEmail.mockResolvedValue({ id_user: 'u1', email: 'a@b.com' });
    repo.findLatestValidResetToken.mockResolvedValue({ id_password_reset_token: 't1', code_hash: 'h' });
    bcryptMock.compare.mockResolvedValue(false);

    await expect(svc.resetPassword({ email: 'a@b.com', code: '000000', newPassword: '12345678' })).rejects.toMatchObject({ status: 400, code: 'invalid_code' });
  });

  it('resetPassword: consumes token + updates password', async () => {
    repo.findUserByEmail.mockResolvedValue({ id_user: 'u1', email: 'a@b.com' });
    repo.findLatestValidResetToken.mockResolvedValue({ id_password_reset_token: 't1', code_hash: 'h' });

    await svc.resetPassword({ email: 'a@b.com', code: '123456', newPassword: '12345678' });

    expect(crypto.hashPassword).toHaveBeenCalledWith('12345678');
    expect(repo.consumeResetTokenAndUpdatePassword).toHaveBeenCalledWith({
      id_user: 'u1',
      id_password_reset_token: 't1',
      password_hash: 'hash_pw',
    });
  });

  it('getPrivateUserData: unauthorized if user missing', async () => {
    repo.findUserById.mockResolvedValue(null);

    await expect(svc.getPrivateUserData('u1')).rejects.toMatchObject({ status: 401, code: 'unauthorized' });
  });

  it('getPrivateUserData: returns shape', async () => {
    repo.findUserById.mockResolvedValue({ id_user: 'u1', role: 'GURU', name: 'Nama' });

    const res = await svc.getPrivateUserData('u1');
    expect(res).toEqual({ id_user: 'u1', role: 'GURU', nama_pengguna: 'Nama', permissions: ['users:read'] });
  });
});
