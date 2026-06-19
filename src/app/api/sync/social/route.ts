import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { readSocialCache } from "@/lib/data/social-cache";
import { syncSocialPosts } from "@/lib/social/sync";
import type { SocialChannel } from "@/lib/social/types";

export async function POST(request: Request) {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      channels?: SocialChannel[];
    };

    const { cache, errors } = await syncSocialPosts(body.channels);

    const failedChannels = Object.keys(errors);
    if (cache.posts.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            failedChannels.length > 0
              ? `All channel syncs failed: ${failedChannels.map((c) => `${c}: ${errors[c as SocialChannel]}`).join("; ")}`
              : "No posts returned from sync.",
          errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      meta: cache.meta,
      postCount: cache.posts.length,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Social sync failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function GET() {
  const { response } = await requireSession();
  if (response) return response;

  const cache = await readSocialCache();

  if (!cache) {
    return NextResponse.json({
      synced: false,
      message: "No cached social data. POST /api/sync/social to sync.",
    });
  }

  return NextResponse.json({
    synced: true,
    meta: cache.meta,
    postCount: cache.posts.length,
  });
}
