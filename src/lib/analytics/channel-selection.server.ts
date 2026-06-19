import { cookies } from "next/headers";
import type { Platform } from "@/lib/types";
import {
  ANALYTICS_CHANNELS_COOKIE,
  parseAnalyticsChannels,
} from "./channel-selection";

export async function getSelectedAnalyticsChannels(): Promise<Platform[]> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(ANALYTICS_CHANNELS_COOKIE)?.value;
  return parseAnalyticsChannels(raw);
}
