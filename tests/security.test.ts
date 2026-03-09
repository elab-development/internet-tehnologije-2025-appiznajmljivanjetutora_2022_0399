import test from 'node:test';
import assert from 'node:assert/strict';
import { NextResponse } from 'next/server';
import {
  applySecurityHeaders,
  createCsrfToken,
  getAuthCookieOptions,
  getCsrfCookieOptions,
  hasValidCsrfToken,
  hasValidSameOrigin,
} from '../src/lib/security';

test('createCsrfToken returns 64-char hex string', () => {
  const token = createCsrfToken();

  assert.equal(token.length, 64);
  assert.match(token, /^[a-f0-9]{64}$/);
});

test('getAuthCookieOptions returns secure cookie settings in production', () => {
  const previousEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  try {
    const options = getAuthCookieOptions();

    assert.equal(options.httpOnly, true);
    assert.equal(options.sameSite, 'lax');
    assert.equal(options.secure, true);
    assert.equal(options.path, '/');
    assert.equal(typeof options.maxAge, 'number');
  } finally {
    process.env.NODE_ENV = previousEnv;
  }
});

test('getCsrfCookieOptions returns readable strict cookie settings in development', () => {
  const previousEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';

  try {
    const options = getCsrfCookieOptions();

    assert.equal(options.httpOnly, false);
    assert.equal(options.sameSite, 'strict');
    assert.equal(options.secure, false);
    assert.equal(options.path, '/');
    assert.equal(typeof options.maxAge, 'number');
  } finally {
    process.env.NODE_ENV = previousEnv;
  }
});

test('applySecurityHeaders adds expected headers', () => {
  const res = NextResponse.json({ ok: true });

  applySecurityHeaders(res);

  assert.equal(res.headers.get('X-Frame-Options'), 'DENY');
  assert.equal(res.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(
    res.headers.get('Referrer-Policy'),
    'strict-origin-when-cross-origin',
  );
  assert.equal(
    res.headers.get('Permissions-Policy'),
    'camera=(), microphone=(), geolocation=()',
  );
  assert.match(
    res.headers.get('Content-Security-Policy') ?? '',
    /default-src 'self'/,
  );
});

test('hasValidSameOrigin returns true when origin matches nextUrl.origin', () => {
  const req = {
    headers: new Headers({ origin: 'http://localhost:3000' }),
    nextUrl: { origin: 'http://localhost:3000' },
  } as never;

  assert.equal(hasValidSameOrigin(req), true);
});

test('hasValidSameOrigin returns false when origin does not match', () => {
  const req = {
    headers: new Headers({ origin: 'http://evil.com' }),
    nextUrl: { origin: 'http://localhost:3000' },
  } as never;

  assert.equal(hasValidSameOrigin(req), false);
});

test('hasValidSameOrigin returns false when origin header is missing', () => {
  const req = {
    headers: new Headers(),
    nextUrl: { origin: 'http://localhost:3000' },
  } as never;

  assert.equal(hasValidSameOrigin(req), false);
});

test('hasValidCsrfToken returns true when cookie and header match', () => {
  const req = {
    cookies: {
      get(name: string) {
        return name === 'csrf_token' ? { value: 'abc123' } : undefined;
      },
    },
    headers: new Headers({ 'x-csrf-token': 'abc123' }),
  } as never;

  assert.equal(hasValidCsrfToken(req), true);
});

test('hasValidCsrfToken returns false when cookie and header do not match', () => {
  const req = {
    cookies: {
      get(name: string) {
        return name === 'csrf_token' ? { value: 'abc123' } : undefined;
      },
    },
    headers: new Headers({ 'x-csrf-token': 'wrong-token' }),
  } as never;

  assert.equal(hasValidCsrfToken(req), false);
});

test('hasValidCsrfToken returns false when cookie is missing', () => {
  const req = {
    cookies: {
      get() {
        return undefined;
      },
    },
    headers: new Headers({ 'x-csrf-token': 'abc123' }),
  } as never;

  assert.equal(hasValidCsrfToken(req), false);
});

test('hasValidCsrfToken returns false when header is missing', () => {
  const req = {
    cookies: {
      get(name: string) {
        return name === 'csrf_token' ? { value: 'abc123' } : undefined;
      },
    },
    headers: new Headers(),
  } as never;

  assert.equal(hasValidCsrfToken(req), false);
});
