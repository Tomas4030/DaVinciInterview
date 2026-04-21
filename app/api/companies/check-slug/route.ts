import { NextRequest, NextResponse } from "next/server";
import { isSlugAvailable } from "@/lib/queries/companies";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const slugRaw = request.nextUrl.searchParams.get("slug") || "";
    const slug = slugify(slugRaw);

    if (!slug || slug.length < 2) {
      return NextResponse.json(
        { available: false, slug, reason: "Slug inválido" },
        { status: 400 },
      );
    }

    const available = await isSlugAvailable(slug);
    return NextResponse.json({ available, slug });
  } catch (error) {
    console.error("Erro ao validar slug:", error);
    return NextResponse.json(
      { error: "Erro ao validar slug" },
      { status: 500 },
    );
  }
}
