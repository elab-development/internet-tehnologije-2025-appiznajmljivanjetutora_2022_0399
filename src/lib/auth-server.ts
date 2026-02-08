import { cookies } from "next/headers";
import { AUTH_COOKIE, verifyToken, type JwtPayload } from "@/lib/auth";

// ne razlikuje se da li se koristi u API ruti ili na clientu, u oba slučaja čita cookie i verifikuje token, 
// vraća payload ako je validan ili null ako nije 
// (npr. nije prijavljen, token istekao, nevalidan...)
export async function getAuthPayload(): Promise<JwtPayload | null> {
  const cookieStore = await cookies(); 
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null; //nema tokena, nije prijavljen
//nije moguće verifikovati token, npr. istekao ili nevalidan 
// -> tretiramo kao neprijavljenog (null)
  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}
