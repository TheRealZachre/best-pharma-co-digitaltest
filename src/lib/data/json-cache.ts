import { existsSync } from "fs";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { isCloudflareWorkersRuntime } from "@/lib/cloudflare-build";

const TMP_DATA_DIR = path.join("/tmp", "digital-dashboard-data");
const KV_KEY_PREFIX = "json-cache:";

type AppDataKv = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
};

const bundledJsonLoaders: Record<string, () => Promise<unknown>> = {
  "best-pharma-co-users.json": () =>
    import("../../../data/best-pharma-co-users.json").then((m) => m.default),
  "users.json": () => import("../../../data/users.json").then((m) => m.default),
  "social-posts.json": () =>
    import("../../../data/social-posts.json").then((m) => m.default),
  "founder-social-posts.json": () =>
    import("../../../data/founder-social-posts.json").then((m) => m.default),
  "linkedin-posts.json": () =>
    import("../../../data/linkedin-posts.json").then((m) => m.default),
  "password-reset-tokens.json": () =>
    Promise.resolve({ tokens: [] }),
};

function getBundledDataDir(): string {
  const candidates = [
    path.join(process.cwd(), "data"),
    path.join(process.cwd(), "..", "..", "data"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return path.join(process.cwd(), "data");
}

function usesEphemeralCache(): boolean {
  const cwd = process.cwd();

  return (
    isCloudflareWorkersRuntime() ||
    process.env.VERCEL === "1" ||
    process.env.VERCEL_ENV !== undefined ||
    process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined ||
    process.env.LAMBDA_TASK_ROOT !== undefined ||
    process.env.CF_PAGES === "1" ||
    process.env.WORKERS_CI === "1" ||
    cwd.startsWith("/var/task")
  );
}

function hasWritableFilesystem(): boolean {
  return !isCloudflareWorkersRuntime();
}

function getWritableDataDir(): string {
  if (usesEphemeralCache()) {
    return TMP_DATA_DIR;
  }

  return getBundledDataDir();
}

function getKvKey(filename: string): string {
  return `${KV_KEY_PREFIX}${filename}`;
}

async function getAppDataKv(): Promise<AppDataKv | null> {
  if (!isCloudflareWorkersRuntime()) return null;

  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext({ async: true });
    return env.APP_DATA_KV ?? null;
  } catch {
    return null;
  }
}

export function getBundledDataPath(filename: string): string {
  return path.join(getBundledDataDir(), filename);
}

export function getRuntimeDataPath(filename: string): string {
  return path.join(getWritableDataDir(), filename);
}

async function readBundledJson<T>(filename: string): Promise<T | null> {
  const loader = bundledJsonLoaders[filename];
  if (!loader) return null;

  try {
    return (await loader()) as T;
  } catch {
    return null;
  }
}

async function readJsonFromKv<T>(filename: string): Promise<T | null> {
  const kv = await getAppDataKv();
  if (!kv) return null;

  const raw = await kv.get(getKvKey(filename));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeJsonToKv<T>(filename: string, data: T): Promise<boolean> {
  const kv = await getAppDataKv();
  if (!kv) return false;

  await kv.put(getKvKey(filename), JSON.stringify(data));
  return true;
}

export async function readJsonCache<T>(filename: string): Promise<T | null> {
  const kvData = await readJsonFromKv<T>(filename);
  if (kvData) return kvData;

  if (isCloudflareWorkersRuntime()) {
    const bundled = await readBundledJson<T>(filename);
    if (bundled) {
      await writeJsonToKv(filename, bundled);
      return bundled;
    }

    return null;
  }

  const readPaths = usesEphemeralCache()
    ? [path.join(TMP_DATA_DIR, filename), getBundledDataPath(filename)]
    : [getBundledDataPath(filename)];

  for (const cachePath of readPaths) {
    try {
      const raw = await readFile(cachePath, "utf8");
      return JSON.parse(raw) as T;
    } catch {
      // Try the next location.
    }
  }

  return readBundledJson<T>(filename);
}

function isReadOnlyFilesystemError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const code = (error as NodeJS.ErrnoException).code;
  return (
    code === "EROFS" ||
    code === "EPERM" ||
    error.message.includes("[unenv]")
  );
}

export async function writeJsonCache<T>(
  filename: string,
  data: T
): Promise<void> {
  if (await writeJsonToKv(filename, data)) {
    return;
  }

  if (!hasWritableFilesystem()) {
    return;
  }

  const content = JSON.stringify(data, null, 2);
  const primaryPath = path.join(getWritableDataDir(), filename);

  try {
    await mkdir(path.dirname(primaryPath), { recursive: true });
    await writeFile(primaryPath, content, "utf8");
    return;
  } catch (error) {
    if (!isReadOnlyFilesystemError(error)) {
      throw error;
    }
  }

  const fallbackPath = path.join(TMP_DATA_DIR, filename);
  try {
    await mkdir(path.dirname(fallbackPath), { recursive: true });
    await writeFile(fallbackPath, content, "utf8");
  } catch (error) {
    if (!isReadOnlyFilesystemError(error)) {
      throw error;
    }
  }
}
