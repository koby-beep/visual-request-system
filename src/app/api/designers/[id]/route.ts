import { NextResponse } from 'next/server';
import { readDesigners, writeDesigners } from '@/lib/designers';

type Params = Promise<{ id: string }>;

export async function DELETE(_: Request, { params }: { params: Params }) {
  const { id } = await params;
  const designers = await readDesigners();
  await writeDesigners(designers.filter(d => d.id !== id));
  return NextResponse.json({ ok: true });
}
