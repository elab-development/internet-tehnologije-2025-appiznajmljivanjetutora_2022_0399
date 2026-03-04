const isProd = process.env.NODE_ENV === "production";

export const authCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: isProd,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

export const clearAuthCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: isProd,
  path: "/",
  maxAge: 0,
};
