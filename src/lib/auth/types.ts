export type UserRole = "admin" | "user";

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  username?: string;
  passwordHash?: string;
  image?: string;
  role: UserRole;
  createdAt: string;
}

export interface UsersDatabase {
  users: UserRecord[];
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: UserRole;
  createdAt: string;
  hasPassword: boolean;
}
