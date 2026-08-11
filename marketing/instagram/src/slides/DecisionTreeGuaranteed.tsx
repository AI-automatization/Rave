import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Logo } from '../components/Logo';

type Status = 'MEXANIZM' | 'CONDITIONAL' | 'RARE';

const STATUS_STYLE: Record<Status, { color: string; bg: string; label: string; dashed?: boolean }> = {
  MEXANIZM:    { color: '#22c55e', bg: 'rgba(34,197,94,0.10)',  label: '✅ 100% — гарантирует харнес, не скрипт' },
  CONDITIONAL: { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', label: '🟡 УСЛОВНО — есть тихий exit-путь' },
  RARE:        { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  label: '🔴 РЕДКО — по факту почти никогда' },
};

const V: React.FC<{ label?: string }> = ({ label }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <div style={{ width: 2, height: 30, background: 'rgba(255,255,255,0.25)' }} />
    {label && <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', margin: '2px 0' }}>{label}</div>}
  </div>
);

const Node: React.FC<{ kicker: string; title: string; status: Status; lines: string[]; width?: number }> = ({
  kicker, title, status, lines, width = 1220,
}) => {
  const s = STATUS_STYLE[status];
  return (
    <div
      style={{
        width,
        borderRadius: 22,
        border: `2px ${s.dashed ? 'dashed' : 'solid'} ${s.color}`,
        background: s.bg,
        padding: '22px 30px',
        boxShadow: `0 0 40px -12px ${s.color}55`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
            {kicker}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginTop: 4 }}>{title}</div>
        </div>
        <div style={{ padding: '7px 14px', borderRadius: 100, background: s.color, color: '#0a0a0f', fontSize: 14, fontWeight: 800, whiteSpace: 'nowrap' }}>
          {status}
        </div>
      </div>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {lines.map((l, i) => (
          <div key={i} style={{ fontSize: 17, color: 'rgba(255,255,255,0.75)', lineHeight: 1.35 }}>{l}</div>
        ))}
      </div>
    </div>
  );
};

export const DecisionTreeGuaranteed: React.FC = () => (
  <AbsoluteFill
    style={{
      background: 'radial-gradient(ellipse at 25% 8%, #1e0f3a 0%, #0c0918 45%, #040407 100%)',
      fontFamily: 'sans-serif',
      alignItems: 'center',
      paddingTop: 70,
      paddingBottom: 90,
    }}
  >
    <AbsoluteFill
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
        backgroundSize: '200px 200px',
        opacity: 0.3,
      }}
    />

    <Logo size={30} />

    <div style={{ textAlign: 'center', marginTop: 22, marginBottom: 30 }}>
      <div style={{ fontSize: 40, fontWeight: 900, color: '#fff' }}>Что реально 100% в КАЖДОМ промпте</div>
      <div style={{ fontSize: 21, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
        Честный аудит с эмпирикой из логов этой же сессии, не из памяти разговора
      </div>
    </div>

    <Node
      kicker="Гарантия харнеса (не скрипта!)"
      title="UserPromptSubmit ЗАПУСКАЕТСЯ на каждый промпт"
      status="MEXANIZM"
      lines={[
        'Это гарантирует Claude Code CLI сам, регистрация в settings.json',
        'Единственный per-prompt hook slot вообще — других таких в системе нет',
        'Запускает ровно 1 процесс: zone-auto-detect.sh',
      ]}
    />
    <V label="дальше — 3 тихих gate внутри самого скрипта" />

    <Node
      kicker="Gate 1 — извлечение текста промпта"
      title="PROMPT=$(...) распарсился?"
      status="CONDITIONAL"
      lines={['[ -z "$PROMPT" ] && exit 0 — если парсинг сломался, тихий выход, ничего не логируется']}
    />
    <V />

    <Node
      kicker="Gate 2 — совпадение с одной из 6 zone-категорий"
      title="Нашёлся keyword?"
      status="RARE"
      lines={[
        'instagram / mobile / backend / web / telegram / ai-agents — только эти 6',
        'Любое сообщение мимо этих слов (вопрос, "да", "продолжи", код-ревью и т.п.) → exit 0, тихо',
      ]}
    />
    <V />

    <Node
      kicker="Gate 3 — зона ИЗМЕНИЛАСЬ с прошлого промпта"
      title="Не та же зона, что была?"
      status="RARE"
      lines={['Если зона та же, что уже загружена — exit 0, повторно не грузит']}
    />
    <V label="только если ВСЕ 3 gate пройдены" />

    <Node
      kicker="Видимый эффект — реально доходит до меня в контекст"
      title="Zone-контекст ЗАГРУЖЕН"
      status="RARE"
      lines={[
        '🔎 РЕАЛЬНАЯ ЦИФРА — проверил лог этой же сессии (/tmp/claude-zone-stats-22470.log):',
        'за сегодня — 7 успешных срабатываний за десятки отправленных сообщений',
        'telegram→backend→telegram→backend→telegram→instagram→telegram',
      ]}
    />

    <div style={{ height: 34 }} />
    <div
      style={{
        width: 1220,
        textAlign: 'center',
        padding: '16px 24px',
        fontSize: 19,
        fontWeight: 700,
        color: 'rgba(255,255,255,0.92)',
        background: 'rgba(124,58,237,0.18)',
        border: '1px solid rgba(124,58,237,0.35)',
        borderRadius: 14,
        lineHeight: 1.5,
      }}
    >
      ЧЕСТНЫЙ ВЫВОД: 100%-гарантия есть только на уровне «харнес вызвал процесс».
      Ни один скрипт в системе не гарантирует 100% ВИДИМЫЙ эффект на каждый промпт —
      у каждого есть тихие exit-пути. Всё, что казалось «automatic», на самом деле
      «invoked always, effective sometimes».
    </div>

    <div style={{ height: 26 }} />
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', width: 1220 }}>
      {(Object.keys(STATUS_STYLE) as Status[]).map((k) => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 16, height: 16, borderRadius: 4, background: STATUS_STYLE[k].color }} />
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)' }}>{STATUS_STYLE[k].label}</div>
        </div>
      ))}
    </div>
  </AbsoluteFill>
);
