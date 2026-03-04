import { NextResponse } from "next/server";
import { getAuthPayload } from "@/lib/auth-server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_BY_MIME: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "application/pdf": [".pdf"],
};

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

  const allowedExtensions = ALLOWED_BY_MIME[file.type];
  const originalExt = path.extname(file.name).toLowerCase();
  if (!allowedExtensions || !allowedExtensions.includes(originalExt)) {
    return NextResponse.json({ error: "Dozvoljeni su JPG, PNG ili PDF." }, { status: 400 });
  }
  if (file.size <= 0) {
    return NextResponse.json({ error: "Fajl je prazan." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Maksimalna velicina fajla je 5MB." }, { status: 413 });
  }

  const filename = `${crypto.randomUUID()}${allowedExtensions[0]}`;
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "verification");
  await mkdir(uploadsDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, filename), buffer);

  return NextResponse.json({ url: `/uploads/verification/${filename}` }, { status: 201 });
}
