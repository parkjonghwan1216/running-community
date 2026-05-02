import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth';

describe('auth', () => {
  it('hashes a password and verifies correctly', async () => {
    const hash = await hashPassword('secret123');
    expect(hash).not.toBe('secret123');
    expect(await verifyPassword('secret123', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });
});
