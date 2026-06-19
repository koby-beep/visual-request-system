import { NextResponse } from 'next/server';
import { readBrands, writeBrands } from '@/lib/brands';

export async function GET() {
  return NextResponse.json(await readBrands());
}

export async function POST(request: Request) {
  const { name } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  const brands = await readBrands();
  const clean = name.trim();
  if (brands.includes(clean)) return NextResponse.json(brands);
  const updated = [...brands, clean].sort((a, b) => a.localeCompare(b));
  await writeBrands(updated);
  return NextResponse.json(updated, { status: 201 });
}
