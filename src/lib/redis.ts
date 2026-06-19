export async function getRedis() {
  if (!process.env.KV_REST_API_URL) return null;
  const { Redis } = await import('@upstash/redis');
  return new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN!,
  });
}
