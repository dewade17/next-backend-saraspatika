import { describe, it, expect } from 'vitest';
import { registerValidation, loginValidation, requestTokenValidation, resetPasswordValidation } from '@/validations/auth/auth_validation.js';

describe('auth_validation', () => {
  it('registerValidation: minimal payload valid', async () => {
    const v = await registerValidation.parseAsync({
      email: 'User@Example.com',
      password: '12345678',
    });

    expect(v.email).toBe('User@Example.com');
    expect(v.autoLogin).toBe(true);
  });

  it('registerValidation: invalid email reject', async () => {
    await expect(registerValidation.parseAsync({ email: 'not-an-email', password: '12345678' })).rejects.toMatchObject({ name: 'ZodError' });
  });

  it('loginValidation: trims and validates', async () => {
    const v = await loginValidation.parseAsync({
      email: '  a@b.com  ',
      password: 'x',
    });

    expect(v.email).toBe('a@b.com');
  });

  it('requestTokenValidation: requires valid email', async () => {
    await expect(requestTokenValidation.parseAsync({ email: 'x' })).rejects.toMatchObject({
      name: 'ZodError',
    });
  });

  it('resetPasswordValidation: code must be 6 digits (string/number ok)', async () => {
    const ok1 = await resetPasswordValidation.parseAsync({
      email: 'a@b.com',
      code: 123456,
      newPassword: '12345678',
    });
    expect(ok1.code).toBe('123456');

    await expect(
      resetPasswordValidation.parseAsync({
        email: 'a@b.com',
        code: '12a456',
        newPassword: '12345678',
      }),
    ).rejects.toMatchObject({ name: 'ZodError' });
  });
});
