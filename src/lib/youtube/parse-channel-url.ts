export interface ParsedChannelInput {
  handle?: string;
  channelId?: string;
  raw: string;
}

export function parseChannelInput(input: string): ParsedChannelInput | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const handleFromUrl = trimmed.match(/youtube\.com\/@([^/?#]+)/i);
  if (handleFromUrl) {
    return { handle: handleFromUrl[1], raw: trimmed };
  }

  const channelIdFromUrl = trimmed.match(/youtube\.com\/channel\/([^/?#]+)/i);
  if (channelIdFromUrl) {
    return { channelId: channelIdFromUrl[1], raw: trimmed };
  }

  if (trimmed.startsWith("@")) {
    return { handle: trimmed.slice(1), raw: trimmed };
  }

  if (/^UC[\w-]{20,}$/.test(trimmed)) {
    return { channelId: trimmed, raw: trimmed };
  }

  if (/^[\w.-]{3,}$/.test(trimmed)) {
    return { handle: trimmed, raw: trimmed };
  }

  return null;
}
