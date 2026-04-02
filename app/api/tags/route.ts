import { NextRequest, NextResponse } from "next/server";
import { searchTags } from "@/lib/repositories/tags";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const tags = searchTags(q, 15);
  return NextResponse.json({ tags });
}
