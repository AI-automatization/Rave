import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Logo } from '../components/Logo';

// Real flowchart version of UnifiedDecisionTree.tsx — same verified content (2026-08-10,
// phase-k-canonical-orchestration.md), but laid out as an actual node-graph with computed
// SVG connector paths (straight, fan-out/fan-in, and curved loop-backs to a named target
// node) instead of a single stacked column. Requested by Saidazim 2026-08-11: the flat
// version "reads like one line" — this one draws real branch geometry and real loop-back
// edges so REWORK/NEGATIVE/UNCLEAR visibly return to the specific node they re-enter at,
// not just a text label saying so.

type Kind = 'DECISION' | 'MECHANISM' | 'GATE' | 'LOOP' | 'TERMINAL';

const KIND: Record<Kind, { c: string; bg: string; label: string }> = {
  DECISION: { c: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: '🔴 DECISION — модель решает' },
  MECHANISM: { c: '#22c55e', bg: 'rgba(34,197,94,0.12)', label: '✅ MECHANISM — код исполняет' },
  GATE: { c: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: '🔵 GATE — код блокирует переход' },
  LOOP: { c: '#a855f7', bg: 'rgba(168,85,247,0.14)', label: '🔁 LOOP — возврат в другую точку' },
  TERMINAL: { c: '#9ca3af', bg: 'rgba(156,163,175,0.12)', label: '⏹ TERMINAL' },
};

interface NodeDef {
  id: string;
  kind: Kind;
  kicker: string;
  title: string;
  lines: string[];
  h: number; // hand-tuned to fit `lines` at the column width it renders in
}
interface Rect { x: number; y: number; w: number; h: number; node: NodeDef }

const CANVAS_W = 1760;
const SINGLE_W = 1120;
const SINGLE_X = (CANVAS_W - SINGLE_W) / 2;
const GAP = 60;

// ---- sequence definition: either a single centered node, or a row of parallel branches ----
type Row = { kind: 'single'; node: NodeDef; label?: string } | { kind: 'branch'; nodes: NodeDef[]; label?: string; colX: number[]; colW: number[] };

const n = (id: string, kind: Kind, kicker: string, title: string, lines: string[], h: number): NodeDef => ({ id, kind, kicker, title, lines, h });

const ROWS: Row[] = [
  { kind: 'single', node: n('entry', 'MECHANISM', 'UserPromptSubmit hook — on-user-prompt-submit.sh: rag-search.sh + decision-tree-nudge.sh, ОБА на каждое сообщение', 'Сообщение приходит', [
    '1) rag-search.sh — контекст, не решение: hybrid RAG (dense+BM25+RRF) печатает top-3',
    '2) decision-tree-nudge.sh — печатает БЕЗУСЛОВНО, на 100% сообщений, само меню ниже',
  ], 170) },
  { kind: 'single', node: n('menu', 'MECHANISM', 'decision-tree-nudge.sh — гарантирован ТОЛЬКО сам вопрос (echo), не суждение', '7-веточное меню (печатается на каждый промпт)', [
    'TRIVIAL_EDIT · QUESTION · CONVERSATION · MEMORY_DECISION · TASK · HIGH_RISK · NEEDS_CLARIFICATION',
    'Плюс: активная задача (state/lifecycle/_active.json) + есть ли Classification для неё',
    'Плюс: 📌-нудж update-last-session.sh — «если тема повисла, пиши next_step/open_questions СЕЙЧАС»',
  ], 220) },
  { kind: 'single', node: n('branchpick', 'DECISION', 'DISCIPLINE — какую из 7 веток выбрать, код не решает', 'Модель сама классифицирует эту ветку', [
    'TRIVIAL_EDIT / QUESTION / CONVERSATION / MEMORY_DECISION / NEEDS_CLARIFICATION → как обычно, В ЭТО ДЕРЕВО НЕ ВХОДЯТ',
    'TASK / HIGH_RISK → единственные ветки с продолжением ниже',
  ], 180) },
  { kind: 'single', node: n('entrygate', 'GATE', 'core/entry-gate.sh — PreToolUse, ГЛОБАЛЬНО, для ЛЮБОЙ из 7 веток', 'Entry Gate — реальный backstop под всеми ветками', [
    'Активная задача с реальной Classification → ALLOW. Иначе classification.py check-action',
    'сканирует ФАКТ команды по DANGEROUS_PATTERNS (drop db, force-push, rm -rf, .env…) → BLOCK',
    'при совпадении, иначе auto-ALLOW как SIMPLE — TRIVIAL_EDIT тоже не обходит эту проверку',
  ], 210) },
  { kind: 'single', node: n('sessionstart', 'DECISION', 'Отдельный механизм — SessionStart hook, 1 раз в начале сессии', '[Session Start] Продолжение или новая / feedback?', [
    'lifecycle.py recovery классифицирует реальный state в баннер (WAITING_FOR_FEEDBACK / RESUME_EXECUTION / …)',
    'Формального классификатора «это continuation» нет — судит модель',
  ], 190) },
  {
    kind: 'branch', label: 'ветка Б разворачивается ниже — основной путь', colX: [40, 640, 1240], colW: [520, 520, 520],
    nodes: [
      n('branchA', 'MECHANISM', 'Ветка А', 'Продолжение', ['lifecycle.py recovery классифицирует реальный state → влиться в дерево в ТУ ЖЕ точку'], 190),
      n('branchB', 'MECHANISM', 'Ветка Б', 'Новая задача', ['task_spec.py commit создаёт TaskSpec → вниз по дереву, с начала'], 190),
      n('branchC', 'MECHANISM', 'Ветка В — только если предыдущая COMPLETED_AWAITING_FEEDBACK', 'Feedback', ['Пропустить сразу к разделу «User Feedback» внизу этого дерева'], 190),
    ],
  },
  { kind: 'single', node: n('understanding', 'MECHANISM', 'MECHANISM: task_spec.py', 'Understanding', [
    'task_type / mode / scope / constraints / risks / unknowns / requires_code_change',
    'ЧТО задача значит — решает модель; СТРУКТУРУ записи — гарантирует код',
  ], 170) },
  { kind: 'single', node: n('enoughinfo', 'DECISION', 'GATE: TaskSpec.status field', 'Достаточно информации?', [
    'READY → продолжить вниз  ·  NEEDS_CLARIFICATION → спросить пользователя, затем заново Understanding',
  ], 150) },
  { kind: 'single', node: n('classification', 'MECHANISM', 'MECHANISM: classification.py commit', 'Classification', [
    'Модель: task_type (текст) / complexity / risk / requires_architecture',
    'МЕХАНИЗМ вычисляет execution_mode и debate_decision — НЕ самоотчёт: regex-скан текста задачи',
    'может принудительно поднять risk («force push to main» при заявленном LOW → механизм: HIGH_RISK)',
  ], 210) },
  { kind: 'single', node: n('classifiedgate', 'GATE', 'GATE: lifecycle.py CLASSIFIED→PLANNING precondition', 'Классификация реально существует?', [
    'Нет Classification-записи → переход в PLANNING отклонён кодом',
  ], 150) },
  { kind: 'single', node: n('planning', 'MECHANISM', 'MECHANISM: planner.py', 'Planning', [
    'Модель проектирует шаги/DAG/verification/acceptance criteria',
    'validate_plan() — детерминированно: циклы, dangling deps, TaskSpec.status must be READY',
  ], 170) },
  { kind: 'single', node: n('planvalidation', 'GATE', 'GATE: planner.py commit refuses invalid plans', 'Plan Validation', [
    'Невалидный план физически не пишется на диск — не проходит к Routing',
  ], 145) },
  { kind: 'single', node: n('routing', 'MECHANISM', 'MECHANISM: router.py', 'Routing', [
    'Task → Capability → Agent → Model, детерминированный scoring',
    'Для HIGH_RISK: независимый ревьюер обязан иметь реальную review-capability',
  ], 170) },
  { kind: 'single', node: n('assignvalidation', 'GATE', 'GATE: router.py validate_assignment (9 проверок)', 'Assignment Validation', [
    'agent существует/ACTIVE, capability/tool/scope, no duplicate, independence (критик ≠ implementer)',
  ], 160) },
  { kind: 'single', node: n('execution', 'MECHANISM', 'MECHANISM: executor.py — ре-валидирует assignments перед стартом', 'Execution', [
    'DAG-aware, checkpoint=файл, idempotent retry',
    'Побочные hooks ЗДЕСЬ: PreToolUse (safety.sh+zone-guard.sh), PostToolUse (checkpoint.sh → FILE_CHANGED)',
  ], 190) },
  { kind: 'single', node: n('unitsgate', 'GATE', 'GATE: lifecycle.py EXECUTING→VERIFYING precondition', 'Все units succeeded?', [
    'Нет → остаётся в Execution/эскалация; крах процесса → RUNNING → INTERRUPTED → RETRYING',
  ], 150) },
  { kind: 'single', node: n('verification', 'MECHANISM', 'MECHANISM: quality_gate.py verify', 'Verification', [
    'Реальные команды (--check), не «агент сказал что всё работает»',
  ], 140) },
  {
    kind: 'branch', colX: [180, 980], colW: [700, 700],
    nodes: [
      n('verifyfailed', 'LOOP', 'FAILED', 'Verification Failed', ['→ тот же Rework Loop, что и Quality Gate ниже (кривая справа)'], 150),
      n('verifypassed', 'GATE', 'PASSED', 'Verification Passed', ['→ Critiquing разрешён'], 150),
    ],
  },
  { kind: 'single', node: n('critic', 'MECHANISM', 'MECHANISM: quality_gate.py critic-report', 'Critic', [
    'Независимость от implementer — безусловна (было: флаг default=False, теперь всегда)',
    'GATE: SCORING требует ≥ min_critic_reports (2 для DEBATE_REQUIRED) от разных agent_id',
  ], 190) },
  { kind: 'single', node: n('scoring', 'MECHANISM', 'MECHANISM: quality_gate.py score', 'Scoring', [
    '0–10 по измерениям; CRITICAL issue переопределяет любой числовой score',
  ], 145) },
  { kind: 'single', node: n('qualitygate', 'GATE', 'DECISION вычисляется кодом, не выбирается моделью', 'Quality Gate', [
    'CRITICAL issue → REWORK, независимо от score', 'score < 9.5 → REWORK  ·  иначе → ACCEPTED',
  ], 175) },
  {
    kind: 'branch', colX: [180, 980], colW: [700, 700],
    nodes: [
      n('rework', 'LOOP', 'Ветка Rework', 'REWORK_REQUIRED', [
        'max_rework_attempts=3 + no-change-loop (artifact hash) → без прогресса HUMAN_REVIEW_REQUIRED',
        'Иначе → PLANNING_REVISION / ROUTING_REVISION / EXECUTION_REVISION (кривая слева → Planning)',
      ], 210),
      n('accepted', 'MECHANISM', 'Ветка Accepted', 'ACCEPTED', ['→ Report'], 145),
    ],
  },
  { kind: 'single', node: n('report', 'MECHANISM', 'MECHANISM: lifecycle.py compose-report', 'Report', [
    'Собирает TaskSpec+Plan+все Run+все QualityRun в один компактный объект',
    'Переиспользует report-функции executor.py и quality_gate.py — не пересчитывает',
  ], 185) },
  { kind: 'single', node: n('awaitingfeedback', 'GATE', 'GATE: report-файл должен существовать', 'COMPLETED_AWAITING_FEEDBACK', [
    'Если ноутбук закрылся здесь — SessionStart покажет WAITING_FOR_FEEDBACK при новой сессии',
  ], 155) },
  { kind: 'single', node: n('userfeedback', 'DECISION', 'DECISION: пользователь классифицирует, quality_gate.py feedback — реальный enum', 'User Feedback', [
    'POSITIVE / NEGATIVE (+4 подтипа) / UNCLEAR — свободной строки больше нет',
    'GATE: подтип NEGATIVE должен совпадать с выбранной веткой возврата',
  ], 190) },
  {
    kind: 'branch', colX: [40, 640, 1240], colW: [520, 520, 520],
    nodes: [
      n('memorygate', 'GATE', 'POSITIVE', 'Memory Commit Gate', ['COMPLETED недостижим без реальной записи (или явного NO_MEMORY)'], 175),
      n('negative', 'LOOP', 'NEGATIVE', 'Возврат в дерево', ['PLANNING_REVISION / EXECUTION_REVISION / VERIFYING / NEEDS_CLARIFICATION (кривая слева → Execution)'], 195),
      n('unclear', 'LOOP', 'UNCLEAR', 'NEEDS_CLARIFICATION', ['Не гадать — вернуться к Understanding (кривая справа)'], 175),
    ],
  },
  { kind: 'single', node: n('memorycommit', 'MECHANISM', 'MECHANISM: memory_commit.py (K.5, project-agnostic, мигрирован из Rave)', 'Memory Commit', [
    'Модель: NEW / UPDATE / SUPERSEDE / NO_MEMORY — что сохранить, решает она',
    'Код: dedup search, frontmatter, provenance, supersession (история не удаляется), reindex',
  ], 185) },
  { kind: 'single', node: n('completed', 'TERMINAL', 'TERMINAL — история всех переходов сохранена, ничего не удалено', 'COMPLETED', [
    'Указатель активной задачи очищается; дерево для этого запроса закрыто',
  ], 150) },
];

// ---- layout: walk ROWS top-to-bottom, compute rects ----
function layout(): { rects: Record<string, Rect>; order: Row[]; totalH: number } {
  const rects: Record<string, Rect> = {};
  let y = 300;
  for (const row of ROWS) {
    if (row.kind === 'single') {
      rects[row.node.id] = { x: SINGLE_X, y, w: SINGLE_W, h: row.node.h, node: row.node };
      y += row.node.h + GAP;
    } else {
      const rowH = Math.max(...row.nodes.map((nd) => nd.h));
      row.nodes.forEach((nd, i) => {
        rects[nd.id] = { x: row.colX[i], y, w: row.colW[i], h: rowH, node: nd };
      });
      y += rowH + GAP;
    }
  }
  return { rects, order: ROWS, totalH: y };
}

const { rects, order, totalH } = layout();

// ---- SVG connector helpers ----
const LINE = 'rgba(255,255,255,0.30)';

function StraightDown({ from, to, label }: { from: Rect; to: Rect; label?: string }) {
  const x = from.x + from.w / 2;
  const y1 = from.y + from.h;
  const y2 = to.y;
  const midY = (y1 + y2) / 2;
  return (
    <>
      <line x1={x} y1={y1} x2={x} y2={y2 - 12} stroke={LINE} strokeWidth={2.5} />
      <polygon points={`${x - 8},${y2 - 12} ${x + 8},${y2 - 12} ${x},${y2}`} fill={LINE} />
      {label && (
        <text x={x + 16} y={midY + 5} fontSize={15} fill="rgba(255,255,255,0.5)" fontStyle="italic">{label}</text>
      )}
    </>
  );
}

function Fan({ fromRect, children, label }: { fromRect: Rect; children: Rect[]; label?: string }) {
  const x0 = fromRect.x + fromRect.w / 2;
  const y0 = fromRect.y + fromRect.h;
  const barY = y0 + 30;
  const xs = children.map((c) => c.x + c.w / 2);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  return (
    <>
      <line x1={x0} y1={y0} x2={x0} y2={barY} stroke={LINE} strokeWidth={2.5} />
      <line x1={minX} y1={barY} x2={maxX} y2={barY} stroke={LINE} strokeWidth={2.5} />
      {xs.map((cx, i) => (
        <g key={i}>
          <line x1={cx} y1={barY} x2={cx} y2={children[i].y - 12} stroke={LINE} strokeWidth={2.5} />
          <polygon points={`${cx - 8},${children[i].y - 12} ${cx + 8},${children[i].y - 12} ${cx},${children[i].y}`} fill={LINE} />
        </g>
      ))}
      {label && <text x={x0} y={barY - 10} fontSize={15} fill="rgba(255,255,255,0.5)" fontStyle="italic" textAnchor="middle">{label}</text>}
    </>
  );
}

// Curved loop-back edge: from a LOOP node's side, routed through the page margin, up/down
// to a named target node's side. `side` picks which margin channel to route through so
// multiple loop curves don't overlap each other.
function LoopBack({ from, to, side, laneOffset, label, color }: { from: Rect; to: Rect; side: 'left' | 'right'; laneOffset: number; label: string; color: string }) {
  const laneX = side === 'left' ? 40 + laneOffset : CANVAS_W - 40 - laneOffset;
  const fx = side === 'left' ? from.x : from.x + from.w;
  const fy = from.y + from.h / 2;
  const tx = side === 'left' ? to.x : to.x + to.w;
  const ty = to.y + to.h / 2;
  const path = `M ${fx} ${fy} C ${laneX} ${fy}, ${laneX} ${ty}, ${tx} ${ty}`;
  const arrowAngle = side === 'left' ? 0 : 180;
  return (
    <>
      <path d={path} fill="none" stroke={color} strokeWidth={2.5} strokeDasharray="7 6" opacity={0.85} />
      <polygon
        points="-9,-6 9,0 -9,6"
        fill={color}
        transform={`translate(${tx},${ty}) rotate(${arrowAngle})`}
      />
      <text x={laneX} y={(fy + ty) / 2} fontSize={13.5} fill={color} fontWeight={700} textAnchor="middle"
        transform={`rotate(-90 ${laneX} ${(fy + ty) / 2})`}>{label}</text>
    </>
  );
}

const NodeBox: React.FC<{ r: Rect }> = ({ r }) => {
  const s = KIND[r.node.kind];
  return (
    <div style={{
      position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h,
      borderRadius: 18, border: `2px ${r.node.kind === 'LOOP' ? 'dashed' : 'solid'} ${s.c}`,
      background: s.bg, padding: '16px 22px', boxShadow: `0 16px 32px -18px rgba(0,0,0,0.7), 0 0 34px -18px ${s.c}`,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'rgba(255,255,255,0.5)', lineHeight: 1.3 }}>{r.node.kicker}</div>
          <div style={{ fontSize: 21, fontWeight: 800, color: '#fff', marginTop: 3 }}>{r.node.title}</div>
        </div>
        <div style={{ flex: 'none', padding: '4px 11px', borderRadius: 100, background: s.c, color: '#0a0a0f', fontSize: 12, fontWeight: 800 }}>{r.node.kind}</div>
      </div>
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {r.node.lines.map((l, i) => <div key={i} style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.32 }}>{l}</div>)}
      </div>
    </div>
  );
};

export const UnifiedDecisionTreeFlow: React.FC = () => {
  const CANVAS_H = totalH + 260;

  // section-divider y positions (label + rule), placed just above the row that starts each section
  const sections: { title: string; beforeId: string }[] = [
    { title: 'Вход', beforeId: 'entry' },
    { title: 'Понимание и классификация', beforeId: 'understanding' },
    { title: 'План и назначение', beforeId: 'planning' },
    { title: 'Выполнение', beforeId: 'execution' },
    { title: 'Проверка качества', beforeId: 'verification' },
    { title: 'Отчёт и feedback', beforeId: 'report' },
  ];

  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse 1400px 800px at 25% 6%, #1e0f3a 0%, #0c0918 45%, #040407 100%)', fontFamily: 'sans-serif' }}>
      <div style={{ position: 'relative', width: CANVAS_W, height: CANVAS_H, margin: '0 auto' }}>

        <Logo size={30} />
        <div style={{ position: 'absolute', top: 60, left: 0, width: CANVAS_W, textAlign: 'center' }}>
          <div style={{ fontSize: 42, fontWeight: 900, color: '#fff' }}>Unified Canonical Decision Tree</div>
          <div style={{ fontSize: 19, color: 'rgba(255,255,255,0.55)', marginTop: 8 }}>
            Полный pipeline от входящего сообщения до memory commit — с реальными loop-back связями
          </div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
            Верифицировано против кода 2026-08-10 · D→K.5 — механизм ИСПОЛНЕНИЯ веток этого дерева, не вторая система
          </div>
        </div>

        {/* section dividers */}
        {sections.map((s, i) => {
          const r = rects[s.beforeId];
          const y = r.y - 44;
          return (
            <div key={i} style={{ position: 'absolute', top: y, left: 0, width: CANVAS_W, textAlign: 'center', fontSize: 13, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)' }}>
              ── {s.title} ──
            </div>
          );
        })}

        {/* connectors (under nodes) */}
        <svg width={CANVAS_W} height={CANVAS_H} style={{ position: 'absolute', top: 0, left: 0 }}>
          {order.map((row, i) => {
            if (i === 0) return null;
            const prev = order[i - 1];
            const prevRect = prev.kind === 'single' ? rects[prev.node.id] : rects[prev.nodes[Math.floor(prev.nodes.length / 2)].id];
            if (row.kind === 'single') {
              const label = row.kind === 'single' && row.label ? row.label : undefined;
              return <StraightDown key={i} from={prevRect} to={rects[row.node.id]} label={label} />;
            }
            return <Fan key={i} fromRect={prevRect} children={row.nodes.map((nd) => rects[nd.id])} label={row.label} />;
          })}

          {/* loop-backs */}
          <LoopBack from={rects.verifyfailed} to={rects.rework} side="right" laneOffset={0} color={KIND.LOOP.c}
            label="verification failed → тот же rework loop" />
          <LoopBack from={rects.rework} to={rects.planning} side="left" laneOffset={0} color={KIND.LOOP.c}
            label="REWORK → Planning / Routing / Execution revision" />
          <LoopBack from={rects.negative} to={rects.execution} side="left" laneOffset={70} color={KIND.LOOP.c}
            label="NEGATIVE → Planning / Execution / Verifying revision" />
          <LoopBack from={rects.unclear} to={rects.understanding} side="right" laneOffset={0} color={KIND.LOOP.c}
            label="UNCLEAR → назад к Understanding" />
          <LoopBack from={rects.enoughinfo} to={rects.understanding} side="right" laneOffset={70} color={KIND.DECISION.c}
            label="NEEDS_CLARIFICATION → заново Understanding" />
        </svg>

        {/* nodes (over connectors) */}
        {Object.values(rects).map((r) => <NodeBox key={r.node.id} r={r} />)}

        {/* callout + legend below the last node */}
        <div style={{ position: 'absolute', top: totalH + 10, left: SINGLE_X, width: SINGLE_W, padding: '18px 26px', borderRadius: 16, background: 'rgba(124,58,237,0.16)', border: '1px solid rgba(124,58,237,0.4)', color: '#fff', fontSize: 15, lineHeight: 1.55, textAlign: 'center' }}>
          Одно дерево, не два: hook-слой — побочные механизмы ВНУТРИ веток, D→K.5 — исполнение и GATE-проверка каждого перехода.
          Пунктирные фиолетовые кривые — реальные loop-back рёбра к конкретному узлу, не просто текст.
        </div>
        <div style={{ position: 'absolute', top: totalH + 130, left: 0, width: CANVAS_W, display: 'flex', gap: 22, flexWrap: 'wrap', justifyContent: 'center' }}>
          {(Object.keys(KIND) as Kind[]).map((k) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
              <div style={{ width: 13, height: 13, borderRadius: 4, background: KIND[k].c }} />
              {KIND[k].label}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const UNIFIED_DECISION_TREE_FLOW_HEIGHT = 300 + (() => { const { totalH: t } = layout(); return t; })() + 260;
