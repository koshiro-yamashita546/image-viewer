import { NextRequest, NextResponse } from "next/server";
import { assertWithinStorage, getStoragePath } from "@/lib/storage";
import fs from "fs";
import path from "path";
import { lookup } from "mime-types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const filePath = path.join(getStoragePath(), ...segments);

  try {
    assertWithinStorage(filePath);
  } catch {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (!fs.existsSync(filePath)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const contentType = lookup(filePath) || "application/octet-stream";

  const stream = fs.createReadStream(filePath);
  const readableStream = new ReadableStream({
    start(controller) {
      stream.on("data", (chunk) =>
        controller.enqueue(
          typeof chunk === "string" ? Buffer.from(chunk) : chunk
        )
      );
      stream.on("end", () => controller.close());
      stream.on("error", (err) => controller.error(err));
    },
    cancel() {
      stream.destroy();
    },
  });

  return new NextResponse(readableStream, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": stat.size.toString(),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
