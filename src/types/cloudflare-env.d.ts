declare global {
  interface CloudflareEnv {
    APP_DATA_KV?: {
      get(key: string): Promise<string | null>;
      put(key: string, value: string): Promise<void>;
    };
  }
}

export {};
