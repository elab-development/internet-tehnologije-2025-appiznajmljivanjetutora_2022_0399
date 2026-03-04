import { vi } from "vitest";

const { getAuthPayloadMock, valuesMock, insertMock } = vi.hoisted(() => {
  const hoistedGetAuthPayloadMock = vi.fn();
  const hoistedValuesMock = vi.fn();
  const hoistedInsertMock = vi.fn(() => ({ values: hoistedValuesMock }));
  return {
    getAuthPayloadMock: hoistedGetAuthPayloadMock,
    valuesMock: hoistedValuesMock,
    insertMock: hoistedInsertMock,
  };
});

vi.mock("@/lib/auth-server", () => ({
  getAuthPayload: getAuthPayloadMock,
}));

vi.mock("@/db", () => ({
  db: {
    insert: insertMock,
  },
}));

import { POST } from "./route";

describe("POST /api/verifikacije", () => {
  beforeEach(() => {
    getAuthPayloadMock.mockReset();
    valuesMock.mockReset();
    insertMock.mockClear();
  });

  it("returns 401 when user is not authenticated", async () => {
    getAuthPayloadMock.mockResolvedValue(null);

    const req = new Request("http://localhost/api/verifikacije", {
      method: "POST",
      body: JSON.stringify({ dokumentUrl: "/uploads/verification/doc.pdf" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toContain("Niste prijavljeni");
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("returns 403 when user is not TUTOR", async () => {
    getAuthPayloadMock.mockResolvedValue({ korisnikId: 7, role: "UCENIK" });

    const req = new Request("http://localhost/api/verifikacije", {
      method: "POST",
      body: JSON.stringify({ dokumentUrl: "/uploads/verification/doc.pdf" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toContain("Nemate pravo");
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("creates verification request for tutor", async () => {
    getAuthPayloadMock.mockResolvedValue({ korisnikId: 9, role: "TUTOR" });
    valuesMock.mockResolvedValue([{ insertId: 1 }]);

    const req = new Request("http://localhost/api/verifikacije", {
      method: "POST",
      body: JSON.stringify({ dokumentUrl: "/uploads/verification/doc.pdf" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.ok).toBe(true);
    expect(insertMock).toHaveBeenCalled();
    expect(valuesMock).toHaveBeenCalled();
  });
});
