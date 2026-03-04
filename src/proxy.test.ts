import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

describe("proxy integration", () => {
  it("redirects unauthenticated user from protected page to /login", async () => {
    const req = new NextRequest("http://localhost/me", { method: "GET" });
    const res = await proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/login");
  });

  it("blocks mutating API requests with invalid CSRF origin", async () => {
    const req = new NextRequest("http://localhost/api/favoriti", {
      method: "POST",
      headers: {
        origin: "http://evil.example",
      },
    });
    const res = await proxy(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toContain("CSRF");
  });

  it("allows auth API mutation for same-origin requests", async () => {
    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      headers: {
        origin: "http://localhost",
        host: "localhost",
      },
    });
    const res = await proxy(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("allows anonymous access to swagger static UI file", async () => {
    const req = new NextRequest("http://localhost/swagger-ui.html", { method: "GET" });
    const res = await proxy(req);

    expect(res.status).toBe(200);
  });
});
