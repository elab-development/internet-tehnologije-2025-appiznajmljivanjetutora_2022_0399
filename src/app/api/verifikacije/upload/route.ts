import { NextResponse } from "next/server";
import { getAuthPayload } from "@/lib/auth-server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(req: Request) {
  const auth = await getAuthPayload();
  if (!auth) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }
  if (auth.role !== "TUTOR") {
    return NextResponse.json({ error: "Nemate pravo na upload." }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fajl je obavezan." }, { status: 400 });
  }

  const allowed = new Set(["image/jpeg", "image/png", "application/pdf"]);
  if (!allowed.has(file.type)) {
    return NextResponse.json({ error: "Dozvoljeni su JPG, PNG ili PDF." }, { status: 400 });
  }

  const ext = path.extname(file.name) || ".bin";
  const filename = `${crypto.randomUUID()}${ext}`;
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "verification");
  await mkdir(uploadsDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, filename), buffer);

  return NextResponse.json({ url: `/uploads/verification/${filename}` }, { status: 201 });
}
