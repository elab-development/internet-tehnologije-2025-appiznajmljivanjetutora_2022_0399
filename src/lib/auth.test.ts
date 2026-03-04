import { signToken, verifyToken } from "@/lib/auth";

describe("auth token helpers", () => {
  it("signToken + verifyToken roundtrip", async () => {
    const token = await signToken({ korisnikId: 42, role: "TUTOR" });
    const payload = await verifyToken(token);

    expect(payload.korisnikId).toBe(42);
    expect(payload.role).toBe("TUTOR");
  });

  it("verifyToken throws for invalid token", async () => {
    await expect(verifyToken("not-a-valid-token")).rejects.toBeTruthy();
  });
});
