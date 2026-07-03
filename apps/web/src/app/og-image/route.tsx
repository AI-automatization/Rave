import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #0A0A0F 0%, #13131F 50%, #0A0A0F 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)',
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #1C0B38, #0A0912)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: '900',
              color: '#7C3AED',
              border: '1px solid rgba(124,58,237,0.4)',
            }}
          >
            W
          </div>
          <span
            style={{
              fontSize: '48px',
              fontWeight: '900',
              color: 'white',
              letterSpacing: '-1px',
            }}
          >
            WeWatch
          </span>
        </div>

        {/* Main headline */}
        <div
          style={{
            fontSize: '64px',
            fontWeight: '900',
            color: 'white',
            textAlign: 'center',
            lineHeight: 1.1,
            marginBottom: '20px',
            letterSpacing: '-2px',
          }}
        >
          СМОТРИТЕ ВИДЕО
          <br />
          <span style={{ color: '#7C3AED' }}>ВМЕСТЕ</span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '24px',
            color: 'rgba(255,255,255,0.6)',
            textAlign: 'center',
            maxWidth: '700px',
            lineHeight: 1.4,
          }}
        >
          YouTube, VK, Rutube с друзьями в реальном времени
        </div>

        {/* Bottom badges */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginTop: '40px',
          }}
        >
          {['Watch Party', 'Синхронный просмотр', 'Бесплатно'].map((label) => (
            <div
              key={label}
              style={{
                padding: '10px 20px',
                borderRadius: '100px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.07)',
                color: 'rgba(255,255,255,0.8)',
                fontSize: '18px',
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
