import { cookies } from 'next/headers';
import { RoomContent } from './RoomContent';
import { WATCH_PARTY_SERVICE_URL, ensureSuffix } from '@/lib/service-urls';

export const metadata = {
  title: 'Watch Party',
};

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ code?: string }>;
}

export default async function RoomPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { code } = await searchParams;

  // Share link (T-S171) carries ?code=INVITECODE for private rooms — the socket's own
  // JOIN_ROOM auto-join (roomEvents.handler.ts) only works for public rooms, so a private
  // room needs the member added via this REST call BEFORE RoomContent's socket connects.
  // Doing it here (server-side, awaited) avoids a race with the client-side socket join —
  // by the time the client mounts, membership already exists or the code was invalid/wrong.
  let needsPassword = false;

  if (code) {
    try {
      const cookieStore = await cookies();
      const accessToken = cookieStore.get('access_token')?.value;
      if (accessToken) {
        const baseUrl = ensureSuffix(WATCH_PARTY_SERVICE_URL, '/api/v1');
        const res = await fetch(`${baseUrl}/watch-party/rooms/join/${code}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: 'no-store',
        });

        // A password-protected room answers 401 with the literal message `password_required`
        // (watchParty.service.ts joinRoom). Until T-S183 this was swallowed and the user just
        // saw the generic "not a member" error, with no way to type the password anywhere.
        if (!res.ok) {
          const body = await res.json().catch(() => null) as { message?: string } | null;
          needsPassword = body?.message === 'password_required';
        }
      }
    } catch {
      // Room join failed (invalid code, room ended, etc.) — let the room UI's own
      // membership error surface instead of failing the whole page render.
    }
  }

  return <RoomContent roomId={id} inviteCode={code} needsPassword={needsPassword} />;
}
