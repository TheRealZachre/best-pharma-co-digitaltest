import type { RawLinkedInPost } from "../types";

interface LinkedInApiPost {
  id?: string;
  commentary?: string;
  publishedAt?: number;
  createdAt?: number;
  lastModifiedAt?: number;
}

export async function fetchPostsFromLinkedInApi(
  organizationId: string,
  accessToken: string,
  maxPosts: number
): Promise<RawLinkedInPost[]> {
  const orgUrn = `urn:li:organization:${organizationId}`;
  const version = process.env.LINKEDIN_API_VERSION ?? "202505";

  const url = new URL("https://api.linkedin.com/rest/posts");
  url.searchParams.set("q", "author");
  url.searchParams.set("author", orgUrn);
  url.searchParams.set("count", String(Math.min(maxPosts, 50)));
  url.searchParams.set("sortBy", "LAST_MODIFIED");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "LinkedIn-Version": version,
      "X-Restli-Protocol-Version": "2.0.0",
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `LinkedIn API failed (${response.status}): ${body.slice(0, 300)}`
    );
  }

  const payload = (await response.json()) as {
    elements?: LinkedInApiPost[];
  };

  return (payload.elements ?? []).map((post, index) => {
    const ts = post.publishedAt ?? post.createdAt ?? post.lastModifiedAt;
    return {
      id: post.id ?? `linkedin-api-${index}`,
      text: post.commentary ?? "",
      publishedAt: new Date(ts ?? Date.now()).toISOString(),
      reactions: 0,
      comments: 0,
      reposts: 0,
    } satisfies RawLinkedInPost;
  });
}
