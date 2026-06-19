import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { shouldProxyImageUrl } from "@/lib/social/image-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function refererForUrl(url: URL): string {
  const host = url.hostname;

  if (host.includes("cdninstagram.com") || host.includes("instagram.com")) {
    return "https://www.instagram.com/";
  }
  if (host.includes("fbcdn.net") || host.includes("facebook.com")) {
    return "https://www.facebook.com/";
  }
  if (host.includes("twimg.com")) {
    return "https://x.com/";
  }
  if (host.includes("licdn.com")) {
    return "https://www.linkedin.com/";
  }
  if (host.includes("ytimg.com") || host.includes("ggpht.com")) {
    return "https://www.youtube.com/";
  }

  return url.origin;
}

export async function GET(request: Request) {
  const { response } = await requireSession();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const target = searchParams.get("url");

  if (!target) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (!shouldProxyImageUrl(parsed.toString())) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: refererForUrl(parsed),
        Origin: refererForUrl(parsed).replace(/\/$/, ""),
        "Sec-Fetch-Dest": "image",
        "Sec-Fetch-Mode": "no-cors",
        "Sec-Fetch-Site": "cross-site",
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${upstream.status}` },
        { status: upstream.status }
      );
    }

    const buffer = await upstream.arrayBuffer();
    const contentType =
      upstream.headers.get("content-type") ?? "image/jpeg";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Image proxy failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
