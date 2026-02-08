import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret");

export type JwtPayload = {
  korisnikId: number;
  role: "UCENIK" | "TUTOR" | "ADMIN";
};
//vraca potpisan token za dati payload (korisnikId i role)
export async function signToken(payload: JwtPayload) { 
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}
//vraca payload iz tokena ako je validan, baci error ako nije
//(nepotpisan, istekao, nevalidan...)
export async function verifyToken(token: string) { 
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as JwtPayload;
}

export const AUTH_COOKIE = "auth_token";
