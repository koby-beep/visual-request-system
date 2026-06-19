import { NextResponse } from 'next/server';
import { readRequests, writeRequests } from '@/lib/store';
import { VisualFormat, VisualRequest } from '@/types';
import { randomUUID } from 'crypto';

export async function GET() {
  return NextResponse.json(await readRequests());
}

export async function POST(request: Request) {
  const body = await request.json();
  const requests = await readRequests();

  const newRequest: VisualRequest = {
    id: randomUUID(),
    requester: body.requester,
    brand: body.brand ?? '',
    type: body.type,
    format: (body.format ?? 'static') as VisualFormat,
    visuals: body.visuals ?? [],
    date: body.date,
    status: 'pending',
    created: new Date().toISOString(),
  };

  requests.unshift(newRequest);
  await writeRequests(requests);
  return NextResponse.json(newRequest, { status: 201 });
}
