import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Logo } from '../components/Logo';

// This diagram is NOT a hooks/mechanism audit (see DecisionTreeReal.tsx for that).
// It is the single canonical decision tree — from an incoming message to a
// memory commit — that the whole system implements. D->K.5 (task_spec.py,
// classification.py, planner.py, router.py, executor.py, quality_gate.py,
// lifecycle.py, memory_commit.py) is not a second system alongside this tree;
// each module is the EXECUTION MECHANISM for one or more of this tree's
// branches. Grounded in the real, tested K1-K10/K.5 implementation
// (phase-k-canonical-orchestration.md), not invented for this picture.

type Kind = 'DECISION' | 'MECHANISM' | 'GATE' | 'LOOP' | 'TERMINAL';

const KIND_STYLE: Record<Kind, { color: string; bg: string; label: string; dashed?: boolean }> = {
  DECISION: { color: '#ef4444', bg: 'rgba(239,68,68,0.10)', label: '🔴 DECISION — модель решает (discipline)' },
  MECHANISM: { color: '#22c55e', bg: 'rgba(34,197,94,0.10)', label: '✅ MECHANISM — код исполняет ветку дерева' },
  GATE: { color: '#3b82f6', bg: 'rgba(59,130,246,0.10)', label: '🔵 GATE — код проверяет и может ЗАБЛОКИРОВАТЬ переход' },
  LOOP: { color: '#a855f7', bg: 'rgba(168,85,247,0.12)', label: '🔁 LOOP — возврат в другую точку этого же дерева' },
  TERMINAL: { color: '#6b7280', bg: 'rgba(107,114,128,0.10)', label: '⏹ TERMINAL / ABSORBING' },
};

const V: React.FC<{ h?: number; label?: string }> = ({ h = 30, label }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <div style={{ width: 2, height: h, background: 'rgba(255,255,255,0.25)' }} />
    {label && <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic', margin: '2px 0', textAlign: 'center' }}>{label}</div>}
  </div>
);

const Node: React.FC<{ kicker: string; title: string; kind: Kind; lines: string[]; width?: number }> = ({ kicker, title, kind, lines, width = 1220 }) => {
  const s = KIND_STYLE[kind];
  return (
    <div style={{ width, borderRadius: 20, border: `2px ${s.dashed ? 'dashed' : 'solid'} ${s.color}`, background: s.bg, padding: '20px 28px', boxShadow: `0 0 36px -12px ${s.color}55` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{kicker}</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginTop: 3 }}>{title}</div>
        </div>
        <div style={{ padding: '6px 12px', borderRadius: 100, background: s.color, color: '#0a0a0f', fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap' }}>{kind}</div>
      </div>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {lines.map((l, i) => <div key={i} style={{ fontSize: 16, color: 'rgba(255,255,255,0.78)', lineHeight: 1.32 }}>{l}</div>)}
      </div>
    </div>
  );
};

const Branch: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', justifyContent: 'center' }}>{children}</div>
);

const Section: React.FC<{ title: string }> = ({ title }) => (
  <div style={{ width: 1220, textAlign: 'center', margin: '6px 0 2px', fontSize: 14, fontWeight: 800, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>
    ── {title} ──
  </div>
);

export const UnifiedDecisionTree: React.FC = () => (
  <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 25% 8%, #1e0f3a 0%, #0c0918 45%, #040407 100%)', fontFamily: 'sans-serif', alignItems: 'center', paddingTop: 60, paddingBottom: 80 }}>
    <AbsoluteFill style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")", backgroundSize: '200px 200px', opacity: 0.3 }} />

    <Logo size={28} />
    <div style={{ textAlign: 'center', marginTop: 18, marginBottom: 22 }}>
      <div style={{ fontSize: 38, fontWeight: 900, color: '#fff' }}>Unified Canonical Decision Tree</div>
      <div style={{ fontSize: 19, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
        Одно дерево решений от входящего сообщения до memory commit — верифицировано против кода 2026-08-10
      </div>
      <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
        D→K.5 (task_spec/classification/planner/router/executor/quality_gate/lifecycle/memory_commit) —
        НЕ отдельная система, это МЕХАНИЗМ ИСПОЛНЕНИЯ веток этого дерева
      </div>
    </div>

    <Section title="ВХОД" />
    <Node kicker="UserPromptSubmit hook — on-user-prompt-submit.sh: rag-search.sh + decision-tree-nudge.sh, ОБА на КАЖДОЕ сообщение" title="СООБЩЕНИЕ ПРИХОДИТ" kind="MECHANISM" lines={[
      '1) rag-search.sh — контекст, не решение: hybrid RAG (dense+BM25+RRF) печатает top-3',
      '2) decision-tree-nudge.sh — печатает БЕЗУСЛОВНО, на 100% сообщений, само меню ниже',
    ]} />
    <V />
    <Node kicker="decision-tree-nudge.sh — гарантирован ТОЛЬКО сам ВОПРОС (echo), не суждение" title="7-ВЕТОЧНОЕ МЕНЮ (печатается на каждый промпт)" kind="MECHANISM" lines={[
      'TRIVIAL_EDIT · QUESTION · CONVERSATION · MEMORY_DECISION · TASK · HIGH_RISK · NEEDS_CLARIFICATION',
      'Плюс: активная задача (state/lifecycle/_active.json) + есть ли Classification для неё',
      'Плюс: 📌-нудж update-last-session.sh — "если тема повисла, пиши next_step/open_questions СЕЙЧАС"',
      '(добавлен 2026-08-10 — единственный механизм continuity разговора между сессиями, ниже отдельно)',
    ]} />
    <V />
    <Node kicker="DISCIPLINE — какую из 7 веток выбрать, код не решает (комментарий скрипта: «guarantees the asking, not the judgment»)" title="МОДЕЛЬ САМА КЛАССИФИЦИРУЕТ ЭТУ ВЕТКУ" kind="DECISION" lines={[
      'TRIVIAL_EDIT / QUESTION / CONVERSATION / MEMORY_DECISION / NEEDS_CLARIFICATION →',
      'дальше действовать как обычно, В ЭТО ДЕРЕВО НЕ ВХОДЯТ — нет вызова task_spec.py вообще',
      'TASK / HIGH_RISK → единственные ветки с реальным продолжением ниже',
    ]} />
    <V />
    <Node kicker="GATE: core/entry-gate.sh — PreToolUse, ГЛОБАЛЬНО, для ЛЮБОЙ из 7 веток, не только TASK" title="ENTRY GATE — реальный backstop под ВСЕМИ ветками" kind="GATE" lines={[
      'На каждый Edit/Write/Bash (после safety.sh + zone-guard.sh): если есть активная задача',
      'С РЕАЛЬНОЙ Classification → ALLOW. Иначе → classification.py check-action сканирует',
      'ФАКТИЧЕСКИЙ текст команды по тем же DANGEROUS_PATTERNS (drop db, force-push, rm -rf,',
      '.env, credentials, mongo drop...) → BLOCK при совпадении, иначе auto-ALLOW как SIMPLE',
      'Вывод: даже "TRIVIAL_EDIT"-ветка не обходит СЫРУЮ безопасность — обходит только',
      'глубину пайплайна (planning/routing/verification/critic), не regex-бэкстоп',
    ]} />
    <V />
    <Node kicker="Отдельный механизм — SessionStart hook (1 раз в начале сессии, НЕ на каждое сообщение)" title="[SESSION START] ПРОДОЛЖЕНИЕ ИЛИ НОВАЯ / FEEDBACK?" kind="DECISION" lines={[
      'lifecycle.py recovery классифицирует РЕАЛЬНЫЙ state активной задачи в баннер',
      '(WAITING_FOR_FEEDBACK / RESUME_EXECUTION / INTERRUPTED_EXECUTION / ... 11 категорий)',
      'Формального классификатора "это сообщение = continuation" нет — судит модель',
    ]} />
    <V />
    <Branch>
      <Node kicker="Ветка А" title="ПРОДОЛЖЕНИЕ" kind="MECHANISM" width={380} lines={[
        'lifecycle.py recovery классифицирует',
        'реальный state → влиться в дерево',
        'в ТУ ЖЕ точку, где остановились',
      ]} />
      <Node kicker="Ветка Б" title="НОВАЯ ЗАДАЧА" kind="MECHANISM" width={380} lines={[
        'task_spec.py commit создаёт TaskSpec',
        '→ вниз по дереву, с самого начала',
      ]} />
      <Node kicker="Ветка В — только если предыдущая задача COMPLETED_AWAITING_FEEDBACK" title="FEEDBACK" kind="MECHANISM" width={380} lines={[
        'Пропустить сразу к разделу',
        '«USER FEEDBACK» внизу этого дерева',
      ]} />
    </Branch>
    <V label="Ветка Б разворачивается ниже — это основной путь дерева" />

    <Section title="ПОНИМАНИЕ И КЛАССИФИКАЦИЯ" />
    <Node kicker="MECHANISM: task_spec.py" title="UNDERSTANDING" kind="MECHANISM" lines={[
      'task_type/mode/scope/constraints/risks/unknowns/requires_code_change',
      'ЧТО задача значит — решает модель; СТРУКТУРУ записи — гарантирует код',
    ]} />
    <V />
    <Node kicker="GATE: TaskSpec.status field" title="ДОСТАТОЧНО ИНФОРМАЦИИ?" kind="DECISION" lines={[
      'READY → продолжить вниз', 'NEEDS_CLARIFICATION → спросить пользователя, затем ЗАНОВО Understanding',
    ]} />
    <V label="READY" />
    <Node kicker="MECHANISM: classification.py commit" title="CLASSIFICATION" kind="MECHANISM" lines={[
      'Модель: task_type (свободный текст) / complexity / risk / requires_architecture',
      'МЕХАНИЗМ вычисляет execution_mode (SIMPLE/NORMAL/DEEP/HIGH_RISK) и debate_decision —',
      'НЕ самоотчёт: реальный regex-скан текста задачи может принудительно поднять risk',
      '(проверено: "force push to main" при заявленном risk=LOW → механизм: HIGH_RISK)',
    ]} />
    <V />
    <Node kicker="GATE: lifecycle.py CLASSIFIED→PLANNING precondition" title="КЛАССИФИКАЦИЯ РЕАЛЬНО СУЩЕСТВУЕТ?" kind="GATE" lines={[
      'Нет Classification-записи → переход в PLANNING отклонён кодом (не просто «должны были»)',
    ]} />
    <V label="классифицировано" />

    <Section title="ПЛАН И НАЗНАЧЕНИЕ" />
    <Node kicker="MECHANISM: planner.py" title="PLANNING" kind="MECHANISM" lines={[
      'Модель проектирует шаги/DAG/verification/acceptance criteria',
      'validate_plan() — ДЕТЕРМИНИРОВАННО: циклы, dangling deps, TaskSpec.status must be READY',
    ]} />
    <V />
    <Node kicker="GATE: planner.py commit refuses invalid plans" title="PLAN VALIDATION" kind="GATE" lines={['Невалидный план физически не пишется на диск — не проходит к Routing']} />
    <V label="план валиден" />
    <Node kicker="MECHANISM: router.py" title="ROUTING" kind="MECHANISM" lines={[
      'Task → Capability → Agent → Model, детерминированный scoring',
      'Для HIGH_RISK: независимый ревьюер обязан иметь реальную review-capability',
    ]} />
    <V />
    <Node kicker="GATE: router.py validate_assignment (9 проверок)" title="ASSIGNMENT VALIDATION" kind="GATE" lines={[
      'agent существует/ACTIVE, capability/tool/scope, no duplicate (plan_id-scoped),',
      'independence (критик ≠ implementer, теперь безусловно) — невалидное не коммитится',
    ]} />
    <V label="назначено" />

    <Section title="ВЫПОЛНЕНИЕ" />
    <Node kicker="MECHANISM: executor.py — ре-валидирует assignments перед стартом" title="EXECUTION" kind="MECHANISM" lines={[
      'DAG-aware, checkpoint=файл, idempotent retry',
      'ПОБОЧНЫЕ hook-механизмы срабатывают ЗДЕСЬ на каждый Edit/Write/Bash:',
      'PreToolUse (safety.sh + zone-guard.sh — блокирует .env/mongo-drop/force-push/zone),',
      'PostToolUse (checkpoint.sh — логирует FILE_CHANGED)',
    ]} />
    <V />
    <Node kicker="GATE: lifecycle.py EXECUTING→VERIFYING precondition" title="ВСЕ UNITS SUCCEEDED?" kind="GATE" lines={['Нет → остаётся в Execution/эскалация; крах процесса → unit виден как RUNNING → INTERRUPTED → RETRYING']} />
    <V label="выполнено" />

    <Section title="ПРОВЕРКА КАЧЕСТВА" />
    <Node kicker="MECHANISM: quality_gate.py verify" title="VERIFICATION" kind="MECHANISM" lines={['Реальные команды (--check), не «агент сказал что всё работает»']} />
    <V />
    <Branch>
      <Node kicker="FAILED" title="VERIFICATION FAILED" kind="LOOP" width={580} lines={['→ REWORK LOOP (см. ниже)']} />
      <Node kicker="PASSED" title="VERIFICATION PASSED" kind="GATE" width={580} lines={['→ CRITIQUING разрешён']} />
    </Branch>
    <V />
    <Node kicker="MECHANISM: quality_gate.py critic-report" title="CRITIC" kind="MECHANISM" lines={[
      'Независимость от implementer — безусловна (было: флаг с default=False, теперь всегда)',
      'GATE: SCORING требует ≥ min_critic_reports (2 для DEBATE_REQUIRED) от РАЗНЫХ agent_id',
    ]} />
    <V />
    <Node kicker="MECHANISM: quality_gate.py score" title="SCORING" kind="MECHANISM" lines={['0–10 по измерениям; CRITICAL issue переопределяет любой числовой score']} />
    <V />
    <Node kicker="DECISION вычисляется кодом, не выбирается моделью" title="QUALITY GATE" kind="GATE" lines={[
      'CRITICAL issue → REWORK, независимо от score',
      'score < 9.5 → REWORK', 'иначе → ACCEPTED',
    ]} />
    <V />
    <Branch>
      <Node kicker="Ветка REWORK" title="REWORK_REQUIRED" kind="LOOP" width={580} lines={[
        'GATE: max_rework_attempts=3 + no-change-loop (artifact hash) —',
        'без прогресса → HUMAN_REVIEW_REQUIRED (не бесконечно)',
        'Иначе → PLANNING_REVISION / ROUTING_REVISION / EXECUTION_REVISION → назад в дерево',
      ]} />
      <Node kicker="Ветка ACCEPTED" title="ACCEPTED" kind="MECHANISM" width={580} lines={['→ REPORT']} />
    </Branch>
    <V label="принято" />

    <Section title="ОТЧЁТ И FEEDBACK" />
    <Node kicker="MECHANISM: lifecycle.py compose-report" title="REPORT" kind="MECHANISM" lines={[
      'Собирает TaskSpec+Plan+все Run+все QualityRun в ОДИН компактный объект',
      'Переиспользует report-функции executor.py и quality_gate.py — не пересчитывает',
    ]} />
    <V />
    <Node kicker="GATE: report-файл должен существовать" title="COMPLETED_AWAITING_FEEDBACK" kind="GATE" lines={['Если ноутбук закрылся здесь — SessionStart покажет WAITING_FOR_FEEDBACK при новой сессии']} />
    <V label="ждём пользователя" />
    <Node kicker="DECISION: пользователь классифицирует, quality_gate.py feedback — реальный enum" title="USER FEEDBACK" kind="DECISION" lines={[
      'POSITIVE / NEGATIVE (+4 подтипа) / UNCLEAR — свободной строки больше нет',
      'GATE: подтип NEGATIVE должен совпадать с выбранной веткой возврата (иначе отклонено)',
    ]} />
    <V />
    <Branch>
      <Node kicker="POSITIVE" title="MEMORY COMMIT GATE" kind="GATE" width={400} lines={[
        'COMPLETED недостижим без реальной записи',
        '(или явного NO_MEMORY решения)',
      ]} />
      <Node kicker="NEGATIVE" title="ВОЗВРАТ В ДЕРЕВО" kind="LOOP" width={400} lines={[
        'PLANNING_REVISION / EXECUTION_REVISION /',
        'VERIFYING / NEEDS_CLARIFICATION — по подтипу',
      ]} />
      <Node kicker="UNCLEAR" title="NEEDS_CLARIFICATION" kind="LOOP" width={400} lines={['Не гадать — вернуться к Understanding']} />
    </Branch>
    <V label="положительный feedback" />
    <Node kicker="MECHANISM: memory_commit.py (K.5, project-agnostic, мигрирован из Rave)" title="MEMORY COMMIT" kind="MECHANISM" lines={[
      'Модель: NEW / UPDATE / SUPERSEDE / NO_MEMORY — что сохранить, решает она',
      'Код: dedup search, frontmatter, provenance, supersession (история не удаляется), reindex',
    ]} />
    <V />
    <Node kicker="TERMINAL — история из всех переходов сохранена, ничего не удалено" title="COMPLETED" kind="TERMINAL" lines={['Указатель активной задачи очищается; дерево для этого запроса закрыто']} />

    <div style={{ height: 30 }} />
    <div style={{ width: 1220, textAlign: 'center', padding: '12px 0', fontSize: 18, fontWeight: 800, color: 'rgba(255,255,255,0.9)', background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(124,58,237,0.35)', borderRadius: 14 }}>
      Одно дерево, не два: hook-слой (RAG-контекст, PreToolUse-safety, PostToolUse-checkpoint) — побочные механизмы ВНУТРИ веток,
      D→K.5 — механизм ИСПОЛНЕНИЯ и GATE-проверки каждого перехода. Ни один hook не запускает дерево целиком —
      вход и продолжение решает модель (DECISION-узлы, красные), но раз внутри — GATE-узлы (синие) реально блокируют нелегальные прыжки.
    </div>

    <div style={{ height: 24 }} />
    <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center', width: 1220 }}>
      {(Object.keys(KIND_STYLE) as Kind[]).map(k => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 14, height: 14, borderRadius: 4, background: KIND_STYLE[k].color }} />
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)' }}>{KIND_STYLE[k].label}</div>
        </div>
      ))}
    </div>
  </AbsoluteFill>
);
