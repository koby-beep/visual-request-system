import fs from 'fs';
import path from 'path';
import { getRedis } from './redis';
import { Designer } from '@/types';

const KEY = 'designers';
const FILE = path.join(process.cwd(), 'data', 'designers.json');

export async function readDesigners(): Promise<Designer[]> {
  const redis = await getRedis();
  if (redis) return (await redis.get<Designer[]>(KEY)) ?? [];
  try {
    if (!fs.existsSync(FILE)) return [];
    return JSON.parse(fs.readFileSync(FILE, 'utf-8'));
  } catch { return []; }
}

export async function writeDesigners(designers: Designer[]): Promise<void> {
  const redis = await getRedis();
  if (redis) { await redis.set(KEY, designers); return; }
  const dir = path.dirname(FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(designers, null, 2));
}
