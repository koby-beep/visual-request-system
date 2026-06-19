import { NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin';
const COOKIE = 'admin_session';

function readCookie(request: Request): string | undefined {
  const header = request.headers.get('cookie') ?? '';
  return header
    .split(';')
    .find(c => c.trim().startsWith(COOKIE + '='))
    ?.split('=')
    .slice(1)
    .join('=')
    .trim();
}

export async function GET(request: Request) {
  const token = readCookie(request);
  return NextResponse.json({ authenticated: token === ADMIN_PASSWORD });
}

export async function POST(request: Request) {
  const { password } = await request.json();
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, ADMIN_PASSWORD, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE);
  return res;
}
