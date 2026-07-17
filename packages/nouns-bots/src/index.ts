import 'dotenv/config';

import { ProposalXBot } from './bot';
import { loadConfig } from './config';
import { RedisBotStateStore } from './redis';
import { NounsSubgraphProposalSource } from './subgraph';
import { XPostPublisher } from './x';

const wait = (milliseconds: number, signal: AbortSignal): Promise<void> =>
  new Promise(resolve => {
    const timer = setTimeout(resolve, milliseconds);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });

const main = async (): Promise<void> => {
  const config = loadConfig();
  const store = new RedisBotStateStore(config.redisUrl, config.redisKeyPrefix);
  const bot = new ProposalXBot(
    new NounsSubgraphProposalSource(config.subgraphUrl, config.subgraphPageSize),
    store,
    new XPostPublisher(config.xCredentials),
    {},
  );
  const controller = new AbortController();
  const stop = () => controller.abort();

  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);

  try {
    while (!controller.signal.aborted) {
      const lockToken = await store.acquireLock(config.lockTtlMs);
      if (lockToken === null) {
        console.warn('Another proposal X bot worker currently holds the Redis lease');
      } else {
        try {
          await bot.tick();
        } catch (error) {
          console.error('Proposal X bot tick failed', error);
        } finally {
          await store.releaseLock(lockToken);
        }
      }

      await wait(config.pollIntervalMs, controller.signal);
    }
  } finally {
    await store.close();
  }
};

main().catch(error => {
  console.error('Proposal X bot failed to start', error);
  process.exitCode = 1;
});
