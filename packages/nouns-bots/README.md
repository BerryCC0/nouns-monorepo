# Nouns Bots

Long-running social automation for Nouns DAO. The initial worker publishes newly indexed
onchain proposals from the official Nouns subgraph to X with a link to the proposal on
[nouns.wtf](https://nouns.wtf/vote).

## Behavior

- Polls the official Nouns subgraph maintained in this monorepo for new proposals.
- On its first boot, stores the latest proposal ID and does not backfill historical proposals.
- Publishes `Nouns DAO Proposal {id}: {title}` followed by `https://nouns.wtf/vote/{id}`.
- Stores its chain cursor and per-proposal delivery records in Redis.
- Uses a Redis lease to prevent concurrent replicas from publishing duplicates.
- If a publish is interrupted, checks the authenticated account's recent posts for the
  proposal marker before retrying.

X does not expose an idempotency key for post creation. Timeline reconciliation narrows the
remaining duplicate risk to an X API outage that affects both post creation and subsequent
timeline reads.

## Setup

Create an X developer app with read/write access and OAuth 1.0a user-context credentials for
the account that should publish the posts. Copy the example environment and add an Ethereum
official mainnet subgraph endpoint and persistent Redis instance:

```sh
cp packages/nouns-bots/.env.example packages/nouns-bots/.env
pnpm --filter @nouns/bots dev
```

Required variables:

- `NOUNS_SUBGRAPH_URL`
- `REDIS_URL`
- `X_API_KEY`
- `X_API_SECRET`
- `X_ACCESS_TOKEN`
- `X_ACCESS_TOKEN_SECRET`

The X user token must belong to the publishing account. Never expose these values to the
webapp or commit them to the repository.

## Verification

```sh
pnpm build --filter=@nouns/bots
pnpm --filter @nouns/bots typecheck
pnpm --filter @nouns/bots test
pnpm --filter @nouns/bots lint
```

## Railway

Deploy this directory as its own worker service using `railway.json`, attach persistent Redis,
and configure the required environment variables. Run one replica; the Redis lease also guards
against accidental overlap during deploys.
