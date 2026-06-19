import { isAuthSecretConfigured } from "@/lib/env";
import { isCloudflareWorkersRuntime } from "@/lib/cloudflare-build";

export async function GET() {
  return Response.json({
    ok: true,
    authSecretConfigured: isAuthSecretConfigured(),
    cloudflareWorkers: isCloudflareWorkersRuntime(),
    nodeEnv: process.env.NODE_ENV ?? "unknown",
  });
}
