import fs from 'fs';
import path from 'path';
import { VisualRequest } from '@/types';

const KEY = 'visual-requests';
const DATA_FILE = path.join(process.cwd(), 'data', 'requests.json');

export async function readRequests(): Promise<VisualRequest[]> {
  if (process.env.UPSTASH_REDIS_REST_URL) {
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    return (await redis.get<VisualRequest[]>(KEY)) ?? [];
  }
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

export async function writeRequests(requests: VisualRequest[]): Promise<void> {
  if (process.env.UPSTASH_REDIS_REST_URL) {
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    await redis.set(KEY, requests);
    return;
  }
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(requests, null, 2));
}
