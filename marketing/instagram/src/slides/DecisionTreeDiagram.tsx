import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Logo } from '../components/Logo';

type Status = 'MEXANIZM' | 'YARIM' | 'DISCIPLINA' | 'ABSENT';

const STATUS_STYLE: Record<Status, { color: string; bg: string; label: string; dashed?: boolean }> = {
  MEXANIZM:   { color: '#22c55e', bg: 'rgba(34,197,94,0.10)',  label: '✅ MEXANIZM — реальный hook' },
  YARIM:      { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', label: '🟡 ЧАСТИЧНО — код есть, но не hooked / не блокирует' },
  DISCIPLINA: { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',  label: '🔴 DISCIPLINA — только текст в CLAUDE.md' },
  ABSENT:     { color: '#6b7280', bg: 'rgba(107,114,128,0.08)', label: '⚫ ОТСУТСТВУЕТ — не найдено вообще', dashed: true },
};

const Arrow: React.FC = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0' }}>
    <div style={{ width: 2, height: 34, background: 'rgba(255,255,255,0.25)' }} />
  </div>
);

const Node: React.FC<{
  kicker: string;
  title: string;
  status: Status;
  lines: string[];
}> = ({ kicker, title, status, lines }) => {
  const s = STATUS_STYLE[status];
  return (
    <div
      style={{
        width: 1180,
        borderRadius: 22,
        border: `2px ${s.dashed ? 'dashed' : 'solid'} ${s.color}`,
        background: s.bg,
        padding: '26px 34px',
        boxShadow: `0 0 40px -12px ${s.color}55`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {kicker}
          </div>
          <div style={{ fontSize: 34, fontWeight: 800, color: '#fff', marginTop: 4 }}>{title}</div>
        </div>
        <div
          style={{
            padding: '8px 16px',
            borderRadius: 100,
            background: s.color,
            color: '#0a0a0f',
            fontSize: 17,
            fontWeight: 800,
            whiteSpace: 'nowrap',
            marginLeft: 20,
          }}
        >
          {status}
        </div>
      </div>
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {lines.map((l, i) => (
          <div key={i} style={{ fontSize: 20, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
};

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      width: 1180,
      textAlign: 'center',
      padding: '10px 0',
      fontSize: 22,
      fontWeight: 800,
      color: 'rgba(255,255,255,0.9)',
      background: 'rgba(124,58,237,0.18)',
      border: '1px solid rgba(124,58,237,0.35)',
      borderRadius: 14,
    }}
  >
    {children}
  </div>
);

export const DecisionTreeDiagram: React.FC = () => (
  <AbsoluteFill
    style={{
      background: 'radial-gradient(ellipse at 25% 8%, #1e0f3a 0%, #0c0918 45%, #040407 100%)',
      fontFamily: 'sans-serif',
      alignItems: 'center',
      paddingTop: 70,
      paddingBottom: 90,
      gap: 0,
    }}
  >
    {/* grain */}
    <AbsoluteFill
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
        backgroundSize: '200px 200px',
        opacity: 0.3,
      }}
    />

    <Logo size={30} />

    <div style={{ textAlign: 'center', marginTop: 22, marginBottom: 34 }}>
      <div style={{ fontSize: 46, fontWeight: 900, color: '#fff' }}>WeWatch Claude Code Harness</div>
      <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
        Реальное состояние на 2026-08-01 — по grep/Read кодовой базы, не по памяти
      </div>
    </div>

    {/* INPUT */}
    <Node
      kicker="Вход"
      title="INPUT — Telegram"
      status="MEXANIZM"
      lines={[
        'MCP plugin:telegram:telegram — live, подтверждено в этой же сессии',
        'Второй канал (добавлен сегодня): MCP telegram-userbot — Telethon, личный аккаунт',
        'send/edit/delete/read/download — без allowlist, действует как реальный юзер',
      ]}
    />
    <Arrow />

    <Node
      kicker="Шаг 1"
      title="O'QI + RAG + MEMORY"
      status="DISCIPLINA"
      lines={[
        'memory-load.sh — реальный grep по CONSTRAINTS/LAST_SESSION/ARCHITECTURE/API/DECISIONS',
        'rag.sh + rag_query.py — реальный embedding-поиск (fastembed, локально)',
        '⚠ Индекс на момент проверки был устаревший (27+ дней)',
        'Ни один из скриптов НЕ подключён ни к одному hook в settings.json',
      ]}
    />
    <Arrow />

    <Node
      kicker="Шаг 2"
      title="DYNAMIC ROUTING"
      status="YARIM"
      lines={[
        'zone-auto-detect.sh — ✅ реальный hook (UserPromptSubmit), regex по ключевым словам',
        'Model-tier (haiku/sonnet/opus) — только текст-рекомендация в CLAUDE.md',
        'Council/ensemble-бот — отдельный standalone-процесс, не в этом пайплайне',
      ]}
    />
    <Arrow />

    <Node
      kicker="Шаг 3"
      title="PLANNER (score/tier)"
      status="ABSENT"
      lines={[
        'Скрипта, считающего SCORE/TIER, не найдено',
        'В CLAUDE.md только текстовое правило: <30мин/1-2 файла vs >60мин/5+ файлов',
      ]}
    />
    <Arrow />

    <Node
      kicker="Шаг 4"
      title="BAJAR + VERIFY"
      status="MEXANIZM"
      lines={[
        'pre-tool-hook.sh — ✅ реальный hook (PreToolUse Edit|Write|Bash)',
        'Блокирует: запись в .env, Mongo drop/dropCollection, force-push в main',
        'eval-loop.sh — гоняет tsc+jest, но НЕ блокирует автоматически (🟡 внутри)',
      ]}
    />
    <Arrow />

    <Node
      kicker="Шаг 5"
      title="SELF-KRITIKA"
      status="DISCIPLINA"
      lines={[
        'self-reflection.md / critic-agent.md / execute-judge-loop.md — реальные skill-файлы',
        'Ни один НЕ подключён как hook — hook физически не видит черновик ответа модели',
        '(тот же архитектурный предел признан и в diagram друга)',
      ]}
    />
    <Arrow />

    <Node
      kicker="Шаг 6"
      title="BER (reply) + SECRET-GUARD"
      status="ABSENT"
      lines={[
        'grep -i secret по .claude/scripts/*.sh — ничего релевантного не найдено',
        'Исходящие сообщения (Telegram/userbot) уходят БЕЗ проверки на токены/пароли',
      ]}
    />
    <Arrow />

    <Node
      kicker="Шаг 7"
      title="FEEDBACK LOOP"
      status="ABSENT"
      lines={[
        'Детектора недовольства / авто-ретрая не найдено вообще',
        'tg-notify.sh — это исходящие уведомления о задачах, не анализ входящих',
      ]}
    />
    <Arrow />

    <Node
      kicker="Шаг 8"
      title="YOZ (xotira)"
      status="MEXANIZM"
      lines={[
        'session-stop.sh — ✅ реальный hook (Stop, user- и project-level settings.json)',
        'Пишет LAST_SESSION.md + zone _context.md + handoff.md автоматически',
        'Самое крепкое звено всей цепи',
      ]}
    />
    <Arrow />

    <Node
      kicker="Выход"
      title="OUTPUT — ответ в Telegram"
      status="MEXANIZM"
      lines={['reply / send_message через подтверждённые MCP-каналы']}
    />

    <div style={{ height: 40 }} />
    <SectionLabel>ИТОГ: 3 узла MEXANIZM, 2 частичных, 2 DISCIPLINA, 2 полностью ОТСУТСТВУЮТ</SectionLabel>

    <div style={{ height: 30 }} />
    <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', justifyContent: 'center', width: 1180 }}>
      {(Object.keys(STATUS_STYLE) as Status[]).map((k) => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 16, height: 16, borderRadius: 4, background: STATUS_STYLE[k].color }} />
          <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)' }}>{STATUS_STYLE[k].label}</div>
        </div>
      ))}
    </div>
  </AbsoluteFill>
);
