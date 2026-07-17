import { afterEach, describe, expect, it, vi } from 'vitest';

import { loadConfig } from './config';

const setXCredentials = (): void => {
  vi.stubEnv('X_API_KEY', 'api-key');
  vi.stubEnv('X_API_SECRET', 'api-secret');
  vi.stubEnv('X_ACCESS_TOKEN', 'access-token');
  vi.stubEnv('X_ACCESS_TOKEN_SECRET', 'access-secret');
};

afterEach(() => vi.unstubAllEnvs());

describe('loadConfig', () => {
  it('reuses the Nouns webapp mainnet subgraph endpoint', () => {
    setXCredentials();
    vi.stubEnv('VITE_MAINNET_SUBGRAPH', 'https://example.com/nouns-mainnet');

    expect(loadConfig().subgraphUrl).toBe('https://example.com/nouns-mainnet');
  });

  it('allows a server-only subgraph endpoint override', () => {
    setXCredentials();
    vi.stubEnv('VITE_MAINNET_SUBGRAPH', 'https://example.com/webapp-subgraph');
    vi.stubEnv('NOUNS_SUBGRAPH_URL', 'https://example.com/bot-subgraph');

    expect(loadConfig().subgraphUrl).toBe('https://example.com/bot-subgraph');
  });
});
