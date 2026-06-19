import { NextResponse } from 'next/server';
import { readDesigners, writeDesigners } from '@/lib/designers';
import { Designer } from '@/types';
import { randomUUID } from 'crypto';

export async function GET() {
  const designers = await readDesigners();
  return NextResponse.json(designers.map(d => ({ id: d.id, name: d.name, username: d.username })));
}

export async function POST(request: Request) {
  const { name, username, password } = await request.json();
  if (!name?.trim() || !username?.trim() || !password?.trim()) {
    return NextResponse.json({ error: 'Name, username and password are required' }, { status: 400 });
  }
  const designers = await readDesigners();
  if (designers.some(d => d.username === username.trim())) {
    return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
  }
  const newDesigner: Designer = {
    id: randomUUID(),
    name: name.trim(),
    username: username.trim(),
    password: password.trim(),
  };
  designers.push(newDesigner);
  await writeDesigners(designers);
  return NextResponse.json({ id: newDesigner.id, name: newDesigner.name, username: newDesigner.username }, { status: 201 });
}
