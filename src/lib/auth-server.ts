import { cookies } from "next/headers";
import { AUTH_COOKIE, verifyToken, type JwtPayload } from "@/lib/auth";

export async function getAuthPayload(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}
