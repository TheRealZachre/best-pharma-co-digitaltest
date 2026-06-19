export function getAuthSecret(): string | undefined {
  return process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
}

export async function getAuthUrl(): Promise<string | undefined> {
  return process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
}

export function isAuthSecretConfigured(): boolean {
  return Boolean(getAuthSecret());
}

export function getAnthropicApiKey(): string | undefined {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key || key.startsWith("sk-ant-your")) return undefined;
  return key;
}

export function isAnthropicConfigured(): boolean {
  return Boolean(getAnthropicApiKey());
}
