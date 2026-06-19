import fs from 'fs';
import path from 'path';
import { getRedis } from './redis';

const KEY = 'brands';
const FILE = path.join(process.cwd(), 'data', 'brands.json');

export async function readBrands(): Promise<string[]> {
  const redis = await getRedis();
  if (redis) return (await redis.get<string[]>(KEY)) ?? [];
  try {
    if (!fs.existsSync(FILE)) return [];
    return JSON.parse(fs.readFileSync(FILE, 'utf-8'));
  } catch { return []; }
}

export async function writeBrands(brands: string[]): Promise<void> {
  const redis = await getRedis();
  if (redis) { await redis.set(KEY, brands); return; }
  const dir = path.dirname(FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(brands, null, 2));
}
