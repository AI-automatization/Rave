import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { WATCH_PARTY_SERVICE_URL, ensureSuffix } from '@/lib/service-urls';

// Instagram Stories canvas. Anything else gets letterboxed by Instagram, which crops the brand
// line off the bottom — so this size is not negotiable.
const WIDTH = 1080;
const HEIGHT = 1920;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.wewatch.uz';

export const runtime = 'edge';

interface Room {
  _id?: string;
  name?: string;
  videoTitle?: string | null;
  inviteCode?: string;
}

// The tagline is baked into the PNG, so it cannot come from next-intl at render time on the client.
// Callers pass ?lang= (the web share dialog sends the active locale); anything else falls back to
// Uzbek, which is what the card shipped with.
const TAGLINE: Record<string, string> = {
  uz: 'Birga tomosha qilamiz',
  ru: 'Смотрим вместе',
  en: 'Watching together',
};

/**
 * GET /api/rooms/[id]/story-image — renders the room as a 1080×1920 PNG for Instagram Stories.
 *
 * Generated server-side rather than drawn on the device: mobile just downloads this PNG and hands
 * it to react-native-share (T-S178), so there is no on-device rasterisation and web/mobile stories
 * look identical.
 *
 * Auth accepts either the browser's httpOnly cookie or a Bearer header, because both clients hit
 * this route — the web share dialog (cookie) and the mobile app (header).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const bearer = req.headers.get('authorization');
  const accessToken = req.cookies.get('access_token')?.value;
  const authHeader = bearer ?? (accessToken ? `Bearer ${accessToken}` : null);

  let room: Room = {};
  if (authHeader) {
    try {
      const baseUrl = ensureSuffix(WATCH_PARTY_SERVICE_URL, '/api/v1');
      const res = await fetch(`${baseUrl}/watch-party/rooms/${id}`, {
        headers: { Authorization: authHeader },
        cache: 'no-store',
      });
      if (res.ok) {
        const body = await res.json() as { data?: Room };
        room = body.data ?? {};
      }
    } catch {
      // Fall through to the generic card — a share that says "watch together on WeWatch" is
      // still useful, and failing the request would just show the user a broken image.
    }
  }

  const tagline = TAGLINE[req.nextUrl.searchParams.get('lang') ?? ''] ?? TAGLINE.uz;
  const title = room.videoTitle || room.name || 'Watch Party';
  const shareUrl = room.inviteCode
    ? `${APP_URL}/room/${id}?code=${room.inviteCode}`
    : `${APP_URL}/room/${id}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          // space-between over three blocks, with the middle one owning the free space. An earlier
          // version paired justifyContent:'center' with marginTop:'auto' on the footer — the auto
          // margin won, the centring did nothing, and the card rendered with a large dead gap.
          justifyContent: 'space-between',
          // Instagram overlays its own UI over roughly the top and bottom 250px of a story, so
          // nothing meaningful may sit there.
          padding: '260px 96px 240px',
          // Matches the app's own dark surface (#060608 chrome) with a violet wash, so the story
          // reads as WeWatch without needing a remote logo asset — satori cannot fetch our SVGs.
          background: 'linear-gradient(160deg, #221a4d 0%, #0d0a1f 45%, #060608 70%, #2a1450 100%)',
          color: '#ffffff',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            padding: '16px 32px',
            borderRadius: 999,
            background: 'rgba(124,58,237,0.16)',
            border: '2px solid rgba(124,58,237,0.45)',
          }}
        >
          <div style={{ width: 22, height: 22, borderRadius: 999, background: '#34D399', display: 'flex' }} />
          <span style={{ fontSize: 34, letterSpacing: 2, color: '#C4B5FD' }}>WATCH PARTY</span>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            // Takes every pixel between the badge and the footer, which is what actually centres
            // the title on the canvas.
            flex: 1,
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: title.length > 60 ? 66 : 88,
              fontWeight: 700,
              lineHeight: 1.15,
              textAlign: 'center',
              // Long video titles would otherwise push the brand line off-canvas.
              maxHeight: 560,
              overflow: 'hidden',
            }}
          >
            {title}
          </div>

          <div style={{ display: 'flex', fontSize: 40, color: 'rgba(255,255,255,0.55)', marginTop: 40 }}>
            {tagline}
          </div>

          <div
            style={{
              display: 'flex',
              width: 160,
              height: 6,
              borderRadius: 999,
              marginTop: 56,
              background: 'linear-gradient(90deg, #7C3AED 0%, #34D399 100%)',
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 18,
          }}
        >
          <span style={{ fontSize: 56, fontWeight: 700, letterSpacing: 4 }}>WeWatch</span>
          <span style={{ fontSize: 30, color: 'rgba(255,255,255,0.45)' }}>{shareUrl}</span>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      headers: {
        // Room title can change mid-session; a stale story card would advertise the wrong film.
        'Cache-Control': 'no-store',
      },
    },
  );
}
