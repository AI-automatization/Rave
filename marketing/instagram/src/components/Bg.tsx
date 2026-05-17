import { AbsoluteFill } from 'remotion';

type BgVariant = 'dark' | 'purple' | 'split';

export const Bg: React.FC<{ variant?: BgVariant }> = ({ variant = 'dark' }) => {
  const gradients: Record<BgVariant, string> = {
    dark: 'radial-gradient(ellipse at 20% 20%, #1a0a2e 0%, #08080F 60%)',
    purple: 'radial-gradient(ellipse at 50% 30%, #2e1065 0%, #0D0D1A 70%)',
    split: 'linear-gradient(135deg, #0D0D1A 0%, #150d2e 50%, #08080F 100%)',
  };

  return (
    <AbsoluteFill style={{ background: gradients[variant] }}>
      {/* grain overlay */}
      <AbsoluteFill
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.04\'/%3E%3C/svg%3E")',
          backgroundSize: '200px 200px',
          opacity: 0.4,
        }}
      />
      {/* ambient glow */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 80% 80%, rgba(124, 58, 237, 0.12) 0%, transparent 70%)',
        }}
      />
    </AbsoluteFill>
  );
};
