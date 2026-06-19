import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { syncLinkedInPosts } from "@/lib/linkedin/sync";
import type { LinkedInDataProvider } from "@/lib/linkedin/types";
import { mergeChannelIntoSocialCache } from "@/lib/social/sync";

export async function POST(request: Request) {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      provider?: LinkedInDataProvider;
    };

    const cache = await syncLinkedInPosts(body.provider);

    await mergeChannelIntoSocialCache("linkedin", cache.posts, {
      postCount: cache.posts.length,
      followers: cache.meta.followers,
      provider: cache.meta.provider,
      dataSource: cache.meta.provider === "seed" ? "seed" : "live",
      syncedAt: cache.meta.syncedAt,
    });

    return NextResponse.json({
      ok: true,
      meta: cache.meta,
      postCount: cache.posts.length,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "LinkedIn sync failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function GET() {
  const { response } = await requireSession();
  if (response) return response;

  const { readPostCache } = await import("@/lib/data/cache");
  const cache = await readPostCache();

  if (!cache) {
    return NextResponse.json({
      synced: false,
      message: "No cached LinkedIn data. POST /api/sync/linkedin to sync.",
    });
  }

  return NextResponse.json({
    synced: true,
    meta: cache.meta,
    postCount: cache.posts.length,
  });
}
