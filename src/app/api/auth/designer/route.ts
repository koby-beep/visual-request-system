import { NextResponse } from 'next/server';
import { readDesigners } from '@/lib/designers';

const COOKIE = 'designer_session';

function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get('cookie') ?? '';
  return header.split(';').find(c => c.trim().startsWith(name + '='))?.split('=').slice(1).join('=').trim();
}

export async function GET(request: Request) {
  const username = readCookie(request, COOKIE);
  if (!username) return NextResponse.json({ authenticated: false, designer: null });
  const designers = await readDesigners();
  const d = designers.find(x => x.username === username);
  if (!d) return NextResponse.json({ authenticated: false, designer: null });
  return NextResponse.json({ authenticated: true, designer: { id: d.id, name: d.name, username: d.username } });
}

export async function POST(request: Request) {
  const { username, password } = await request.json();
  const designers = await readDesigners();
  const d = designers.find(x => x.username === username && x.password === password);
  if (!d) return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  const res = NextResponse.json({ ok: true, designer: { id: d.id, name: d.name, username: d.username } });
  res.cookies.set(COOKIE, d.username, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE);
  return res;
}
