import test from "node:test";
import assert from "node:assert/strict";
import { NextResponse } from "next/server";
import {
  applySecurityHeaders,
  createCsrfToken,
  getAuthCookieOptions,
  getCsrfCookieOptions,
  hasValidCsrfToken,
  hasValidSameOrigin,
} from "../src/lib/security";

test("csrf token has expected format", () => {
  const token = createCsrfToken();
  assert.equal(token.length, 64);
  assert.match(token, /^[a-f0-9]+$/);
});

test("auth cookie options are secure in production", () => {
  const previousEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";

  try {
    const options = getAuthCookieOptions();
    assert.equal(options.httpOnly, true);
    assert.equal(options.sameSite, "lax");
    assert.equal(options.secure, true);
    assert.equal(options.path, "/");
  } finally {
    process.env.NODE_ENV = previousEnv;
  }
});

test("csrf cookie options are readable on client and strict", () => {
  const previousEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";

  try {
    const options = getCsrfCookieOptions();
    assert.equal(options.httpOnly, false);
    assert.equal(options.sameSite, "strict");
    assert.equal(options.secure, false);
  } finally {
    process.env.NODE_ENV = previousEnv;
  }
});

test("security headers are applied to response", () => {
  const res = NextResponse.json({ ok: true });
  applySecurityHeaders(res);

  assert.equal(res.headers.get("X-Frame-Options"), "DENY");
  assert.equal(res.headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(res.headers.get("Referrer-Policy"), "strict-origin-when-cross-origin");
  assert.match(res.headers.get("Content-Security-Policy") ?? "", /default-src 'self'/);
});

test("same-origin request passes validation", () => {
  const req = {
    headers: new Headers({ origin: "http://localhost:3000" }),
    nextUrl: { origin: "http://localhost:3000" },
  } as never;

  assert.equal(hasValidSameOrigin(req), true);
});

test("csrf token validation requires matching cookie and header", () => {
  const req = {
    cookies: {
      get(name: string) {
        return name === "csrf_token" ? { value: "abc123" } : undefined;
      },
    },
    headers: new Headers({ "x-csrf-token": "abc123" }),
  } as never;

  assert.equal(hasValidCsrfToken(req), true);
});
