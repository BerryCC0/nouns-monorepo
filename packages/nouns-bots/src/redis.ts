import type { BotStateStore, DeliveryRecord } from './types';

import { randomUUID } from 'node:crypto';

import { createClient } from '@redis/client';

const RELEASE_LOCK_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

export class RedisBotStateStore implements BotStateStore {
  private readonly redis: ReturnType<typeof createClient>;
  private readonly connected: Promise<unknown>;

  constructor(
    redisUrl: string,
    private readonly keyPrefix: string,
  ) {
    this.redis = createClient({ url: redisUrl });
    this.redis.on('error', error => console.error('Redis client error', error));
    this.connected = this.redis.connect();
  }

  async getCursor(): Promise<bigint | null> {
    await this.connected;
    const value = await this.redis.get(this.key('proposal-cursor:1'));
    return value === null ? null : BigInt(value);
  }

  async setCursor(proposalId: bigint): Promise<void> {
    await this.connected;
    await this.redis.set(this.key('proposal-cursor:1'), proposalId.toString());
  }

  async getDelivery(proposalId: bigint): Promise<DeliveryRecord | null> {
    await this.connected;
    const value = await this.redis.get(this.key(`delivery:1:${proposalId}`));
    return value === null ? null : (JSON.parse(value) as DeliveryRecord);
  }

  async setDelivery(delivery: DeliveryRecord): Promise<void> {
    await this.connected;
    await this.redis.set(this.key(`delivery:1:${delivery.proposalId}`), JSON.stringify(delivery));
  }

  async acquireLock(ttlMs: number): Promise<string | null> {
    await this.connected;
    const token = randomUUID();
    const result = await this.redis.set(this.key('worker-lock:1'), token, { PX: ttlMs, NX: true });
    return result === 'OK' ? token : null;
  }

  async releaseLock(token: string): Promise<void> {
    await this.connected;
    await this.redis.eval(RELEASE_LOCK_SCRIPT, {
      keys: [this.key('worker-lock:1')],
      arguments: [token],
    });
  }

  async close(): Promise<void> {
    await this.connected;
    await this.redis.quit();
  }

  private key(suffix: string): string {
    return `${this.keyPrefix}:${suffix}`;
  }
}
