export interface PasswordResetRecord {
  token: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
  usedAt?: string;
}

export interface PasswordResetDatabase {
  tokens: PasswordResetRecord[];
}
