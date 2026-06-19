import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { readJsonCache, writeJsonCache } from "@/lib/data/json-cache";
import {
  buildPasswordResetUrl,
  createPasswordResetToken,
  findValidPasswordResetToken,
  markPasswordResetTokenUsed,
  sendPasswordResetEmail,
} from "./password-reset";
import { resolveRoleForEmail } from "./roles";
import { getAuthUrl } from "@/lib/env";
import type { PublicUser, UserRecord, UserRole, UsersDatabase } from "./types";

const USERS_FILE = "best-pharma-co-users.json";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function isValidUsername(username: string): boolean {
  return /^[a-z0-9][a-z0-9._-]{2,31}$/.test(username);
}

function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    role: user.role ?? "user",
    createdAt: user.createdAt,
    hasPassword: Boolean(user.passwordHash),
  };
}

async function readUsersDb(): Promise<UsersDatabase> {
  const data = await readJsonCache<UsersDatabase>(USERS_FILE);
  if (!data) return { users: [] };

  return {
    users: data.users.map((user) => ({
      ...user,
      role: user.role ?? "user",
    })),
  };
}

async function writeUsersDb(db: UsersDatabase): Promise<void> {
  await writeJsonCache(USERS_FILE, db);
}

function assertUniqueIdentity(
  db: UsersDatabase,
  email: string,
  username?: string
): void {
  if (db.users.some((user) => user.email === email)) {
    throw new Error("An account with this email already exists.");
  }

  if (username && db.users.some((user) => user.username === username)) {
    throw new Error("This username is already taken.");
  }
}

export async function listUsers(): Promise<PublicUser[]> {
  const db = await readUsersDb();
  return db.users
    .map(toPublicUser)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function findUserByEmail(
  email: string
): Promise<UserRecord | undefined> {
  const normalized = normalizeEmail(email);
  const db = await readUsersDb();
  return db.users.find((user) => user.email === normalized);
}

export async function findUserByUsername(
  username: string
): Promise<UserRecord | undefined> {
  const normalized = normalizeUsername(username);
  const db = await readUsersDb();
  return db.users.find((user) => user.username === normalized);
}

export async function findUserByLogin(
  login: string
): Promise<UserRecord | undefined> {
  const trimmed = login.trim();
  if (!trimmed) return undefined;

  if (trimmed.includes("@")) {
    return findUserByEmail(trimmed);
  }

  return findUserByUsername(trimmed);
}

export async function findUserById(
  id: string
): Promise<UserRecord | undefined> {
  const db = await readUsersDb();
  return db.users.find((user) => user.id === id);
}

export async function deleteUser(
  userId: string,
  options?: { actingUserId?: string }
): Promise<void> {
  const db = await readUsersDb();
  const user = db.users.find((entry) => entry.id === userId);
  if (!user) throw new Error("User not found.");

  if (options?.actingUserId && options.actingUserId === userId) {
    throw new Error("You cannot delete your own account.");
  }

  const adminCount = db.users.filter((entry) => entry.role === "admin").length;
  if (user.role === "admin" && adminCount <= 1) {
    throw new Error("Cannot delete the only admin account.");
  }

  db.users = db.users.filter((entry) => entry.id !== userId);
  await writeUsersDb(db);

  const { removePasswordResetTokensForUser } = await import("./password-reset");
  await removePasswordResetTokensForUser(userId);
}

export async function isUserAdminById(userId: string): Promise<boolean> {
  const user = await findUserById(userId);
  return user?.role === "admin";
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  username?: string;
  role?: UserRole;
}

export async function createUserWithPassword(
  input: CreateUserInput
): Promise<UserRecord> {
  const email = normalizeEmail(input.email);
  const username = input.username
    ? normalizeUsername(input.username)
    : undefined;
  const db = await readUsersDb();

  if (username && !isValidUsername(username)) {
    throw new Error(
      "Username must be 3–32 characters and use letters, numbers, dots, dashes, or underscores."
    );
  }

  assertUniqueIdentity(db, email, username);

  const passwordHash = await bcrypt.hash(input.password, 12);
  const isFirstUser = db.users.length === 0;
  const user: UserRecord = {
    id: randomUUID(),
    name: input.name.trim(),
    email,
    username,
    passwordHash,
    role:
      input.role ??
      resolveRoleForEmail(email, { isFirstUser }),
    createdAt: new Date().toISOString(),
  };

  db.users.push(user);
  await writeUsersDb(db);
  return user;
}

export interface UpsertOAuthUserInput {
  email: string;
  name: string;
  image?: string;
}

export async function upsertOAuthUser(
  input: UpsertOAuthUserInput
): Promise<UserRecord> {
  const email = normalizeEmail(input.email);
  const db = await readUsersDb();
  const existing = db.users.find((user) => user.email === email);

  if (existing) {
    existing.name = input.name.trim() || existing.name;
    if (input.image) existing.image = input.image;
    if (getAdminEmailsIncludes(email)) {
      existing.role = "admin";
    }
    await writeUsersDb(db);
    return existing;
  }

  const isFirstUser = db.users.length === 0;
  const user: UserRecord = {
    id: randomUUID(),
    name: input.name.trim() || email,
    email,
    image: input.image,
    role: resolveRoleForEmail(email, { isFirstUser }),
    createdAt: new Date().toISOString(),
  };

  db.users.push(user);
  await writeUsersDb(db);
  return user;
}

function getAdminEmailsIncludes(email: string): boolean {
  return resolveRoleForEmail(email) === "admin";
}

export async function verifyUserPassword(
  login: string,
  password: string
): Promise<UserRecord | null> {
  const user = await findUserByLogin(login);
  if (!user?.passwordHash) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  return valid ? user : null;
}

export function isAdminUser(user: Pick<UserRecord, "role"> | undefined): boolean {
  return user?.role === "admin";
}

export interface UpdateUserProfileInput {
  name?: string;
  email?: string;
  username?: string;
}

export async function updateUserProfile(
  userId: string,
  input: UpdateUserProfileInput
): Promise<UserRecord> {
  const db = await readUsersDb();
  const user = db.users.find((entry) => entry.id === userId);
  if (!user) throw new Error("User not found.");

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) throw new Error("Name is required.");
    user.name = name;
  }

  if (input.email !== undefined) {
    const email = normalizeEmail(input.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("A valid email address is required.");
    }
    if (db.users.some((entry) => entry.id !== userId && entry.email === email)) {
      throw new Error("An account with this email already exists.");
    }
    user.email = email;
  }

  if (input.username !== undefined) {
    const username = normalizeUsername(input.username);
    if (!username) {
      user.username = undefined;
    } else {
      if (!isValidUsername(username)) {
        throw new Error(
          "Username must be 3–32 characters and use letters, numbers, dots, dashes, or underscores."
        );
      }
      if (
        db.users.some(
          (entry) => entry.id !== userId && entry.username === username
        )
      ) {
        throw new Error("This username is already taken.");
      }
      user.username = username;
    }
  }

  await writeUsersDb(db);
  return user;
}

export async function updateUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await findUserById(userId);
  if (!user) throw new Error("User not found.");
  if (!user.passwordHash) {
    throw new Error("This account uses Google sign-in. Set a new password below.");
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new Error("Current password is incorrect.");

  if (newPassword.length < 8) {
    throw new Error("New password must be at least 8 characters.");
  }

  const db = await readUsersDb();
  const record = db.users.find((entry) => entry.id === userId);
  if (!record) throw new Error("User not found.");

  record.passwordHash = await bcrypt.hash(newPassword, 12);
  await writeUsersDb(db);
}

export async function setUserPassword(
  userId: string,
  newPassword: string
): Promise<void> {
  if (newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const db = await readUsersDb();
  const user = db.users.find((entry) => entry.id === userId);
  if (!user) throw new Error("User not found.");

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await writeUsersDb(db);
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<UserRecord> {
  const resetRecord = await findValidPasswordResetToken(token);
  if (!resetRecord) {
    throw new Error("This reset link is invalid or has expired.");
  }

  if (newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const db = await readUsersDb();
  const user = db.users.find((entry) => entry.id === resetRecord.userId);
  if (!user) throw new Error("User not found.");

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await writeUsersDb(db);
  await markPasswordResetTokenUsed(token);
  return user;
}

export async function requestPasswordReset(
  login: string,
  origin?: string
): Promise<{
  sent: boolean;
  devResetUrl?: string;
}> {
  const user = await findUserByLogin(login);
  if (!user?.passwordHash) {
    return { sent: false };
  }

  const record = await createPasswordResetToken(user.id);
  const baseUrl =
    origin ?? (await getAuthUrl()) ?? "http://localhost:3000";
  const resetUrl = buildPasswordResetUrl(baseUrl, record.token);
  const emailed = await sendPasswordResetEmail(user.email, resetUrl);

  if (emailed) return { sent: true };

  if (process.env.NODE_ENV === "development") {
    return { sent: false, devResetUrl: resetUrl };
  }

  return { sent: false };
}
