import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { certNeedsRenewal, isOurCertificate, resolverRule, webServerEnv, WEB_HOST } from '../src/main/local-web-model';

describe('webServerEnv', () => {
  it('points every BFF service at the public production backend and binds to loopback only', () => {
    const env = webServerEnv(41234);
    expect(env.HOSTNAME).toBe('127.0.0.1');
    expect(env.PORT).toBe('41234');
    expect(env.NODE_ENV).toBe('production');
    expect(env.AUTH_SERVICE_URL).toBe('https://core-production-dbd0.up.railway.app/api/v1/auth');
    expect(env.WATCH_PARTY_SERVICE_URL).toBe('https://media-production-97dd.up.railway.app/api/v1');
    expect(env.CONTENT_SERVICE_URL).toBe('https://media-production-97dd.up.railway.app/api/v1');
    for (const [k, v] of Object.entries(env)) if (k.endsWith('_SERVICE_URL')) expect(v.startsWith('https://')).toBe(true);
  });
  it('carries no secret', () => {
    expect(Object.keys(webServerEnv(1)).some((k) => /SECRET|TOKEN|KEY/i.test(k))).toBe(false);
  });
});

describe('resolverRule', () => {
  it('maps only the app host to loopback', () => {
    expect(resolverRule(47443)).toBe(`MAP ${WEB_HOST} 127.0.0.1:47443`);
  });
  it.each([0, -1, 65536, 1.5, Number.NaN])('rejects port %s', (p) => {
    expect(() => resolverRule(p)).toThrow();
  });
});

describe('isOurCertificate', () => {
  const der = Buffer.from('fake certificate bytes');
  const digest = createHash('sha256').update(der).digest();
  const nodeFp = [...digest].map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(':');
  const electronFp = `sha256/${digest.toString('base64')}`;
  it('accepts the exact certificate', () => {
    expect(isOurCertificate(electronFp, nodeFp)).toBe(true);
  });
  it('refuses any other certificate', () => {
    const other = createHash('sha256').update('other').digest();
    expect(isOurCertificate(`sha256/${other.toString('base64')}`, nodeFp)).toBe(false);
  });
  it('refuses a malformed fingerprint', () => {
    expect(isOurCertificate(electronFp, '')).toBe(false);
    expect(isOurCertificate(electronFp, 'zz')).toBe(false);
  });
});

describe('certNeedsRenewal', () => {
  const now = new Date('2026-11-13T00:00:00Z');
  it('renews when missing or unreadable', () => {
    expect(certNeedsRenewal(null, now)).toBe(true);
    expect(certNeedsRenewal('garbage', now)).toBe(true);
  });
  it('renews within the margin, keeps otherwise', () => {
    expect(certNeedsRenewal('Nov 20 00:00:00 2026 GMT', now)).toBe(true);
    expect(certNeedsRenewal('Nov 20 00:00:00 2028 GMT', now)).toBe(false);
  });
});
