import { runProposalXBot } from '../runtime';

export default async (): Promise<Response> => {
  const result = await runProposalXBot();
  return new Response(result, { status: 200 });
};

export const config = {
  schedule: '*/5 * * * *',
};
