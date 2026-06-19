import { NextResponse } from 'next/server';
import { readRequests, writeRequests } from '@/lib/store';

type Params = Promise<{ id: string }>;

export async function PATCH(request: Request, { params }: { params: Params }) {
  const { id } = await params;
  const body = await request.json();
  const requests = await readRequests();
  const idx = requests.findIndex(r => r.id === id);

  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  requests[idx] = { ...requests[idx], ...body };
  await writeRequests(requests);

  return NextResponse.json(requests[idx]);
}

export async function DELETE(_: Request, { params }: { params: Params }) {
  const { id } = await params;
  const requests = await readRequests();
  await writeRequests(requests.filter(r => r.id !== id));
  return NextResponse.json({ ok: true });
}
