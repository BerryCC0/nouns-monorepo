const required = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
};

const nonNegativeInteger = (name: string, fallback: number): number => {
  const raw = process.env[name] ?? fallback.toString();
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer`);
  }
  return value;
};

const positiveInteger = (name: string, fallback: number): number => {
  const value = nonNegativeInteger(name, fallback);
  if (value === 0) throw new Error(`${name} must be greater than zero`);
  return value;
};

export interface BotConfig {
  subgraphUrl: string;
  subgraphPageSize: number;
  redisUrl: string;
  redisKeyPrefix: string;
  pollIntervalMs: number;
  lockTtlMs: number;
  xCredentials: {
    appKey: string;
    appSecret: string;
    accessToken: string;
    accessSecret: string;
  };
}

export const loadConfig = (): BotConfig => {
  const pollIntervalMs = positiveInteger('POLL_INTERVAL_MS', 30_000);
  return {
    subgraphUrl: required('NOUNS_SUBGRAPH_URL'),
    subgraphPageSize: positiveInteger('SUBGRAPH_PAGE_SIZE', 100),
    redisUrl: required('REDIS_URL'),
    redisKeyPrefix: process.env.REDIS_KEY_PREFIX?.trim() || 'nouns:proposal-x',
    pollIntervalMs,
    lockTtlMs: Math.max(pollIntervalMs * 2, 300_000),
    xCredentials: {
      appKey: required('X_API_KEY'),
      appSecret: required('X_API_SECRET'),
      accessToken: required('X_ACCESS_TOKEN'),
      accessSecret: required('X_ACCESS_TOKEN_SECRET'),
    },
  };
};
