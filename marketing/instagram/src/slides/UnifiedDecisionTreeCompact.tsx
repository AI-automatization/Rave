import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Logo } from '../components/Logo';

// One-glance version of UnifiedDecisionTreeFlow.tsx — same verified pipeline (2026-08-10),
// collapsed from ~28 nodes to 8 stages so it fits one photo / one message. Detail lives in
// DecisionTree-Flow; this is the "what it is and how it works" summary, not a replacement.

type Kind = 'DECISION' | 'MECHANISM' | 'GATE' | 'LOOP' | 'TERMINAL';
const KIND: Record<Kind, { c: string; bg: string }> = {
  DECISION: { c: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  MECHANISM: { c: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  GATE: { c: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  LOOP: { c: '#a855f7', bg: 'rgba(168,85,247,0.14)' },
  TERMINAL: { c: '#9ca3af', bg: 'rgba(156,163,175,0.12)' },
};

const CANVAS_W = 1280;
const COL_X = 90;
const COL_W = 1020;
const GAP = 34;
const LINE = 'rgba(255,255,255,0.30)';

interface Rect { id: string; x: number; y: number; w: number; h: number; kind: Kind; kicker: string; title: string; line: string }

const rows: { id: string; kind: Kind; kicker: string; title: string; line: string; h: number }[] = [
  { id: 'in', kind: 'MECHANISM', kicker: 'на каждое сообщение', title: 'Входящее сообщение', line: 'RAG-контекст + 7-веточное меню печатается ВСЕГДА — модель сама выбирает ветку', h: 118 },
  { id: 'gate', kind: 'GATE', kicker: 'ЛЮБАЯ из веток, не только TASK', title: 'Entry Gate', line: 'Опасные команды (drop db, rm -rf, .env, force-push) блокируются кодом всегда', h: 118 },
  { id: 'understand', kind: 'MECHANISM', kicker: 'task_spec.py → classification.py', title: 'Понимание и классификация задачи', line: 'Модель решает ЧТО это; код форсирует HIGH_RISK, если текст задачи это выдаёт', h: 118 },
  { id: 'plan', kind: 'MECHANISM', kicker: 'planner.py → router.py', title: 'План и назначение', line: 'Невалидный план не пишется на диск; агент/модель назначаются детерминированно', h: 118 },
  { id: 'exec', kind: 'MECHANISM', kicker: 'executor.py', title: 'Выполнение', line: 'DAG-выполнение с чекпоинтами; safety-хуки проверяют каждый файл на лету', h: 118 },
  { id: 'quality', kind: 'GATE', kicker: 'verify → critic → score', title: 'Проверка качества', line: 'CRITICAL issue или score < 9.5 → REWORK (код решает, не модель), иначе ACCEPTED', h: 128 },
  { id: 'feedback', kind: 'DECISION', kicker: 'quality_gate.py feedback', title: 'Отчёт и решение пользователя', line: 'POSITIVE → дальше; NEGATIVE / UNCLEAR → возврат в дерево на нужный этап', h: 128 },
  { id: 'memory', kind: 'TERMINAL', kicker: 'memory_commit.py', title: 'Memory Commit → COMPLETED', line: 'Модель решает что сохранить; код гарантирует дедуп и историю — ничего не удаляется', h: 118 },
];

function layout(): Rect[] {
  let y = 260;
  return rows.map((r) => {
    const rect: Rect = { ...r, x: COL_X, y, w: COL_W, h: r.h };
    y += r.h + GAP;
    return rect;
  });
}
const RECTS = layout();
const byId = (id: string) => RECTS.find((r) => r.id === id)!;
const TOTAL_H = RECTS[RECTS.length - 1].y + RECTS[RECTS.length - 1].h;

function Arrow({ from, to }: { from: Rect; to: Rect }) {
  const x = from.x + from.w / 2;
  const y1 = from.y + from.h, y2 = to.y;
  return (
    <>
      <line x1={x} y1={y1} x2={x} y2={y2 - 10} stroke={LINE} strokeWidth={2.5} />
      <polygon points={`${x - 7},${y2 - 10} ${x + 7},${y2 - 10} ${x},${y2}`} fill={LINE} />
    </>
  );
}

function LoopBack({ from, to, label, laneOffset = 0 }: { from: Rect; to: Rect; label: string; laneOffset?: number }) {
  const laneX = from.x + from.w + 46 + laneOffset;
  const fx = from.x + from.w, fy = from.y + from.h / 2;
  const tx = to.x + to.w, ty = to.y + to.h / 2;
  const path = `M ${fx} ${fy} C ${laneX} ${fy}, ${laneX} ${ty}, ${tx} ${ty}`;
  return (
    <>
      <path d={path} fill="none" stroke={KIND.LOOP.c} strokeWidth={2.5} strokeDasharray="7 6" opacity={0.9} />
      <polygon points="9,-6 -9,0 9,6" fill={KIND.LOOP.c} transform={`translate(${tx},${ty})`} />
      <text x={laneX + 5} y={(fy + ty) / 2} fontSize={13} fill={KIND.LOOP.c} fontWeight={700}
        transform={`rotate(-90 ${laneX + 5} ${(fy + ty) / 2})`} textAnchor="middle">{label}</text>
    </>
  );
}

const Box: React.FC<{ r: Rect }> = ({ r }) => {
  const s = KIND[r.kind];
  return (
    <div style={{
      position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h,
      borderRadius: 16, border: `2px ${r.kind === 'LOOP' ? 'dashed' : 'solid'} ${s.c}`, background: s.bg,
      padding: '14px 22px', boxShadow: `0 14px 28px -16px rgba(0,0,0,0.7), 0 0 30px -16px ${s.c}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{r.kicker}</div>
        <div style={{ padding: '3px 10px', borderRadius: 100, background: s.c, color: '#0a0a0f', fontSize: 11, fontWeight: 800 }}>{r.kind}</div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginTop: 2 }}>{r.title}</div>
      <div style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.8)', marginTop: 5, lineHeight: 1.3 }}>{r.line}</div>
    </div>
  );
};

export const UnifiedDecisionTreeCompact: React.FC = () => {
  const CANVAS_H = TOTAL_H + 200;
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse 1200px 700px at 25% 6%, #1e0f3a 0%, #0c0918 45%, #040407 100%)', fontFamily: 'sans-serif' }}>
      <div style={{ position: 'relative', width: CANVAS_W, height: CANVAS_H, margin: '0 auto' }}>
        <Logo size={26} />
        <div style={{ position: 'absolute', top: 52, left: 0, width: CANVAS_W, textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#fff' }}>Decision Tree — как это работает</div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
            8 стадий, входящее сообщение → memory commit · верифицировано против кода 2026-08-10
          </div>
        </div>

        <svg width={CANVAS_W} height={CANVAS_H} style={{ position: 'absolute', top: 0, left: 0 }}>
          {RECTS.slice(1).map((r, i) => <Arrow key={r.id} from={RECTS[i]} to={r} />)}
          <LoopBack from={byId('quality')} to={byId('plan')} label="REWORK → назад к плану" laneOffset={0} />
          <LoopBack from={byId('feedback')} to={byId('understand')} label="NEGATIVE/UNCLEAR → назад в дерево" laneOffset={40} />
        </svg>

        {RECTS.map((r) => <Box key={r.id} r={r} />)}

        <div style={{ position: 'absolute', top: TOTAL_H + 20, left: COL_X, width: COL_W, padding: '13px 20px', borderRadius: 14, background: 'rgba(124,58,237,0.16)', border: '1px solid rgba(124,58,237,0.4)', color: '#fff', fontSize: 13.5, lineHeight: 1.45, textAlign: 'center' }}>
          🔴 модель решает · 🟢 код исполняет · 🔵 код может заблокировать · 🟣 возврат в дерево (реальная кривая) · Entry Gate работает под ВСЕМИ 7 ветками, не только TASK
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const UNIFIED_DECISION_TREE_COMPACT_HEIGHT = TOTAL_H + 200;
