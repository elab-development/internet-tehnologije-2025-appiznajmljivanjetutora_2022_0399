"use client";

const CSRF_COOKIE = "csrf_token";

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1] ?? "") : "";
}

export function withCsrfHeaders(headers?: HeadersInit) {
  const nextHeaders = new Headers(headers);
  const token = readCookie(CSRF_COOKIE);
  if (token) {
    nextHeaders.set("x-csrf-token", token);
  }
  return nextHeaders;
}

export function jsonRequest(
  method: "POST" | "PUT" | "DELETE",
  body?: unknown,
  headers?: HeadersInit
) {
  return {
    method,
    headers: withCsrfHeaders({
      "Content-Type": "application/json",
      ...headers,
    }),
    body: body === undefined ? undefined : JSON.stringify(body),
  };
}

export function formRequest(method: "POST" | "PUT", body: FormData, headers?: HeadersInit) {
  return {
    method,
    headers: withCsrfHeaders(headers),
    body,
  };
}
