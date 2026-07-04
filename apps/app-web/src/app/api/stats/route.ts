import { NextResponse } from 'next/server';

const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL ?? 'http://localhost:3002';

const INTERNAL_SECRET = process.env.INTERNAL_SECRET ?? '';

export async function GET(): Promise<NextResponse> {
  try {
    const res = await fetch(`${USER_SERVICE_URL}/api/v1/users/internal/admin/stats`, {
      headers: { 'X-Internal-Secret': INTERNAL_SECRET },
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      return NextResponse.json({ totalUsers: 0, activeUsers: 0 }, { status: 200 });
    }

    const data = (await res.json()) as { totalUsers: number; activeUsers: number; newUsersThisWeek: number };
    return NextResponse.json(
      { totalUsers: data.totalUsers, activeUsers: data.activeUsers },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json({ totalUsers: 0, activeUsers: 0 });
  }
}
