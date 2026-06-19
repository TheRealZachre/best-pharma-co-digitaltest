import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { readFounderSocialCache } from "@/lib/data/founder-cache";
import { syncFounderPosts } from "@/lib/social/founder-sync";

export async function POST(request: Request) {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      channels?: Array<"linkedin" | "x">;
    };

    const { cache, errors } = await syncFounderPosts(body.channels);

    const failedChannels = Object.keys(errors);
    if (cache.posts.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            failedChannels.length > 0
              ? `All channel syncs failed: ${failedChannels
                  .map((c) => `${c}: ${errors[c as "linkedin" | "x"]}`)
                  .join("; ")}`
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
      error instanceof Error ? error.message : "Founder sync failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function GET() {
  const { response } = await requireSession();
  if (response) return response;

  const cache = await readFounderSocialCache();

  if (!cache) {
    return NextResponse.json({
      synced: false,
      message:
        "No founder social data cached. POST /api/sync/founder to sync.",
    });
  }

  return NextResponse.json({
    synced: true,
    meta: cache.meta,
    postCount: cache.posts.length,
  });
}
