import { randomBytes } from "crypto";
import { readJsonCache, writeJsonCache } from "@/lib/data/json-cache";
import type {
  PasswordResetDatabase,
  PasswordResetRecord,
} from "./password-reset-types";

const RESET_FILE = "password-reset-tokens.json";
const TOKEN_TTL_MS = 60 * 60 * 1000;

async function readResetDb(): Promise<PasswordResetDatabase> {
  const data = await readJsonCache<PasswordResetDatabase>(RESET_FILE);
  return data ?? { tokens: [] };
}

async function writeResetDb(db: PasswordResetDatabase): Promise<void> {
  const now = Date.now();
  db.tokens = db.tokens.filter(
    (entry) =>
      !entry.usedAt && new Date(entry.expiresAt).getTime() > now - 24 * 60 * 60 * 1000
  );
  await writeJsonCache(RESET_FILE, db);
}

export async function createPasswordResetToken(
  userId: string
): Promise<PasswordResetRecord> {
  const db = await readResetDb();
  const now = new Date();

  for (const entry of db.tokens) {
    if (entry.userId === userId && !entry.usedAt) {
      entry.usedAt = now.toISOString();
    }
  }

  const token = randomBytes(32).toString("hex");
  const record: PasswordResetRecord = {
    token,
    userId,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + TOKEN_TTL_MS).toISOString(),
  };

  db.tokens.push(record);
  await writeResetDb(db);
  return record;
}

export async function findValidPasswordResetToken(
  token: string
): Promise<PasswordResetRecord | null> {
  const db = await readResetDb();
  const entry = db.tokens.find(
    (record) => record.token === token && !record.usedAt
  );

  if (!entry) return null;
  if (new Date(entry.expiresAt).getTime() < Date.now()) return null;
  return entry;
}

export async function markPasswordResetTokenUsed(token: string): Promise<void> {
  const db = await readResetDb();
  const entry = db.tokens.find((record) => record.token === token);
  if (entry) entry.usedAt = new Date().toISOString();
  await writeResetDb(db);
}

export async function removePasswordResetTokensForUser(
  userId: string
): Promise<void> {
  const db = await readResetDb();
  db.tokens = db.tokens.filter((record) => record.userId !== userId);
  await writeResetDb(db);
}

export function buildPasswordResetUrl(
  origin: string,
  token: string
): string {
  return `${origin.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
}

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<boolean> {
  const { sendResendEmail } = await import("@/lib/email/resend");

  return sendResendEmail({
    to: email,
    subject: "Reset your password",
    html: `<p>You requested a password reset.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>`,
  });
}
