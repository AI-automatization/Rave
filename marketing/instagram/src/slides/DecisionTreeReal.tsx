import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Logo } from '../components/Logo';

type Status = 'MEXANIZM' | 'YARIM' | 'DISCIPLINA' | 'ABSENT' | 'DUBL' | 'READY_MANUAL';

const STATUS_STYLE: Record<Status, { color: string; bg: string; label: string; dashed?: boolean }> = {
  MEXANIZM:   { color: '#22c55e', bg: 'rgba(34,197,94,0.10)',  label: '✅ MEXANIZM — реальный hook' },
  YARIM:      { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', label: '🟡 ЧАСТИЧНО — часть мертва/условна' },
  DISCIPLINA: { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',  label: '🔴 DISCIPLINA — вне hook-системы, решает модель' },
  ABSENT:     { color: '#6b7280', bg: 'rgba(107,114,128,0.08)', label: '⚫ ОТСУТСТВУЕТ — hook-слот даже не покрывает это', dashed: true },
  DUBL:       { color: '#a855f7', bg: 'rgba(168,85,247,0.12)', label: '🔎 НАЙДЕННЫЙ ДУБЛЬ — выполняется дважды' },
  READY_MANUAL: { color: '#3b82f6', bg: 'rgba(59,130,246,0.10)', label: '🔵 ГОТОВ, НЕ АВТОМАТИЗИРОВАН — реальный код, ни один hook не вызывает' },
};

const V: React.FC<{ h?: number; label?: string }> = ({ h = 34, label }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <div style={{ width: 2, height: h, background: 'rgba(255,255,255,0.25)' }} />
    {label && (
      <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', margin: '2px 0' }}>{label}</div>
    )}
  </div>
);

const Node: React.FC<{
  kicker: string;
  title: string;
  status: Status;
  lines: string[];
  width?: number;
}> = ({ kicker, title, status, lines, width = 1220 }) => {
  const s = STATUS_STYLE[status];
  return (
    <div
      style={{
        width,
        borderRadius: 22,
        border: `2px ${s.dashed ? 'dashed' : 'solid'} ${s.color}`,
        background: s.bg,
        padding: '24px 30px',
        boxShadow: `0 0 40px -12px ${s.color}55`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {kicker}
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', marginTop: 4 }}>{title}</div>
        </div>
        <div
          style={{
            padding: '7px 14px',
            borderRadius: 100,
            background: s.color,
            color: '#0a0a0f',
            fontSize: 15,
            fontWeight: 800,
            whiteSpace: 'nowrap',
          }}
        >
          {status}
        </div>
      </div>
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {lines.map((l, i) => (
          <div key={i} style={{ fontSize: 18, color: 'rgba(255,255,255,0.75)', lineHeight: 1.35 }}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
};

const Branch: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', gap: 26, alignItems: 'flex-start', justifyContent: 'center' }}>{children}</div>
);

export const DecisionTreeReal: React.FC = () => (
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
      <div style={{ fontSize: 42, fontWeight: 900, color: '#fff' }}>Реальный жизненный цикл — 2026-08-09 (после Phase K.5)</div>
      <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
        Заново перепроверено в тот же день после Phase K/K.5: hooks не изменились, но D→J пайплайн стал D→K.5 и начал сам себя ограничивать
      </div>
    </div>

    <Node
      kicker="Событие: SessionStart (один раз за сессию)"
      title="СТАРТ СЕССИИ"
      status="MEXANIZM"
      lines={[
        'Единственная регистрация (user settings.json) → on-session-start.sh → core/session-start.sh',
        'Project-agnostic: определяет проект по CLAUDE_PROJECT_DIR/git-root, ищет projects/*/config.json',
        'Для Rave грузит project-adapter (obsidian-session-start.sh) — Hub/CONSTRAINTS/LAST_SESSION,',
        'лимиты строк (было head -15/-40/-60 хардкодом) теперь читаются из config/context_policy.json',
        'Плюс READ-ONLY: вызывает lifecycle.py recovery (K3, реальный классификатор —',
        '11 категорий: WAITING_FOR_FEEDBACK/INTERRUPTED_EXECUTION/REWORK_STALLED/...),',
        'НЕ inline-словарь как раньше — но это по-прежнему только ЧТЕНИЕ, не advance',
      ]}
    />
    <V />

    <Node
      kicker="Событие: UserPromptSubmit (КАЖДОЕ сообщение)"
      title="СООБЩЕНИЕ ПРИХОДИТ"
      status="MEXANIZM"
      lines={[
        'on-user-prompt-submit.sh → rag-search.sh — тот же hybrid RAG (dense+BM25+RRF), но теперь',
        'project-agnostic: venv/index путь берёт из projects/<id>/config.json, не хардкод',
        'Тихие exit-пути прежние: промпт < 15 символов / нет project-adapter / нет индекса',
        'eval_set.json переподтверждён 8/8, MRR@5=0.717 — ранжирование не менялось с 08-08',
      ]}
    />
    <V label="дальше — решает модель, не hook" />

    <Branch>
      <Node
        kicker="Разветвление А"
        title="Явная зона / память?"
        status="DISCIPLINA"
        width={580}
        lines={[
          'zone-load.sh / memory-load.sh — реальные скрипты, по-прежнему вызываются',
          'только если модель сама решит — НЕ триггерятся автоматически ни одним hook',
          '🔎 но: zone-load.sh пишет /tmp/claude-active-zone — это теперь читает PreToolUse ↓',
        ]}
      />
      <Node
        kicker="Разветвление Б"
        title="Вызов инструмента"
        status="YARIM"
        width={580}
        lines={[
          'Дальше зависит от ТИПА инструмента',
          '— см. следующий уровень',
        ]}
      />
    </Branch>
    <V />

    <Branch>
      <Node
        kicker="Событие: PreToolUse, matcher='Edit|Write|Bash'"
        title="Edit / Write / Bash"
        status="MEXANIZM"
        width={580}
        lines={[
          'on-pre-tool-use.sh → safety.sh (project-agnostic, глобальный):',
          '.env-запись, Mongo drop, force-push в main — все 3 подтверждены заново в коде',
          '→ затем zone-guard.sh (per-project, из projects/rave/config.json)',
        ]}
      />
      <Node
        kicker="Событие: PreToolUse — НЕ покрывает этот тип"
        title="MCP-тул (reply/send/…)"
        status="ABSENT"
        width={580}
        lines={[
          'Перепроверено — та же дыра: matcher буквально',
          "'Edit|Write|Bash', MCP-вызовы всё ещё не проходят через hook",
          'Не починено с 08-08 — не задача Phase J, честно осталось',
        ]}
      />
    </Branch>
    <V label="ZONE GUARD — новый реальный слой с 08-08" />

    <Node
      kicker="zone-guard.sh — реальный блок, не текст в CLAUDE.md"
      title="ZONE GUARD (protected_zones)"
      status="YARIM"
      lines={[
        '🔎 находка: старый zone-auto-detect.sh И pre-tool-hook.sh — ОБА подтверждённо',
        'orphaned (0 совпадений grep по всем settings.json/hooks/core/projects)',
        'На их месте — projects/rave/config.json → protected_zones (сейчас 1 зона: apps/mobile/)',
        'Реально блокирует Edit/Write, если /tmp/claude-active-zone не содержит "mobile"',
        'ЧАСТИЧНО: блок реален, но требует что модель ЗАРАНЕЕ вызвала zone-load.sh —',
        'без этого шага (DISCIPLINA-звено выше) enforcement не сработает вовремя',
      ]}
    />
    <V />

    <Node
      kicker="Событие: PostToolUse, matcher Edit|Write"
      title="ПОСЛЕ РЕДАКТИРОВАНИЯ ФАЙЛА"
      status="MEXANIZM"
      lines={[
        '🔎 ДУБЛЬ ИЗ 08-08 ПОДТВЕРЖДЁННО ПОЧИНЕН: ровно 1 регистрация в user settings.json,',
        'в project settings.json (Rave) хуков вообще больше нет — вся ai-orchestrator миграция',
        'checkpoint.sh: log_event("FILE_CHANGED") → events/<project>.jsonl (тот же лог,',
        'что J6 working memory и J10 observability теперь читают/пишут)',
        '+ дописывает in-progress-{dev}.md, только если status: active',
      ]}
    />
    <V />

    <Node
      kicker="Событие: Notification (редко — долгая задача/нужен ввод)"
      title="УВЕДОМЛЕНИЕ"
      status="YARIM"
      lines={[
        'on-notification.sh → notification.sh — macOS osascript реально работает',
        'Перепроверено заново: CLAUDE_TG_BOT_TOKEN всё ещё не задан — Telegram-ветка',
        'по-прежнему мертва, не тронуто с 08-08',
      ]}
    />
    <V />

    <Node
      kicker="Событие: Stop (Ctrl+C или штатный выход)"
      title="КОНЕЦ СЕССИИ"
      status="MEXANIZM"
      lines={[
        '🔎 ДУБЛЬ ИЗ 08-08 ПОДТВЕРЖДЁННО ПОЧИНЕН: ровно 1 регистрация (user settings.json)',
        'on-stop.sh → core/session-stop.sh → `source` project-adapter session-stop.sh —',
        'ОДИН раз, не bash-subcall внутри самого себя, как было раньше',
      ]}
    />
    <V />

    <Node
      kicker="Вне hook-системы — 9 модулей, все project-agnostic (K.5 закрыл последнюю Rave-зависимость)"
      title="D→K.5 ORCHESTRATOR PIPELINE (~ai-orchestrator/core/*.py)"
      status="READY_MANUAL"
      lines={[
        'task_spec → classification → planner → router → executor → quality_gate →',
        'lifecycle, + context_manager.py (J) + memory_commit.py (K.5, только что',
        'переехал из Rave/.claude/scripts — grep всего оркестратора: 0 хардкод-путей',
        'на Rave вне projects/rave/, как и должно быть)',
        'Перепроверено сейчас, тот же день: подтверждено — ни один hook эти .py',
        'не вызывает. SessionStart только ЧИТАЕТ (lifecycle.py recovery), не продвигает',
        '⇒ весь пайплайн включается ТОЛЬКО если модель сама решит его запустить',
      ]}
    />
    <V label="ГЛАВНОЕ ИЗМЕНЕНИЕ ЭТОЙ СЕССИИ — внутри пайплайна" />

    <Node
      kicker="lifecycle.py advance — было: принимает любой --to-state. Стало: реально проверяет"
      title="TRANSITION GRAPH — теперь mechanically enforced"
      status="MEXANIZM"
      lines={[
        'VALID_TRANSITIONS (19 states) + PRECONDITIONS — каждый переход читает РЕАЛЬНЫЙ',
        'TaskSpec/Classification/Plan/Run/QualityRun и отказывается менять state, если',
        'условие не выполнено. NEW→ACCEPTED, EXECUTING→ACCEPTED (в обход verify/critic/',
        'score) — теперь физически отклоняются кодом, не просто "модель не должна так делать"',
        'classification.py: execution_mode/debate_decision — НЕ самоотчёт модели,',
        'вычисляются механизмом. Проверено вживую: модель заявила risk=LOW для',
        '"force push to main" — механизм принудительно поднял до HIGH_RISK',
        'ЧАСТИЧНО: это ограничивает ПОСЛЕДОВАТЕЛЬНОСТЬ действий ВНУТРИ пайплайна —',
        'не делает сам вызов пайплайна обязательным (см. узел выше)',
      ]}
    />

    <div style={{ height: 34 }} />
    <div
      style={{
        width: 1220,
        textAlign: 'center',
        padding: '12px 0',
        fontSize: 20,
        fontWeight: 800,
        color: 'rgba(255,255,255,0.9)',
        background: 'rgba(124,58,237,0.18)',
        border: '1px solid rgba(124,58,237,0.35)',
        borderRadius: 14,
      }}
    >
      08-09 (после K.5): hooks не изменились с прошлой проверки — всё ещё 6 регистраций, дубли не вернулись · memory_commit.py мигрирован, 0 хардкод-путей на Rave вне projects/rave/ · ГЛАВНОЕ: lifecycle.py advance больше не принимает любой --to-state — 19-state граф + preconditions реально блокируют нелегальные переходы, execution_mode/debate_decision вычисляются механизмом, не самоотчёт модели · НО: MCP-тулы всё ещё вне PreToolUse, Telegram-notify всё ещё мертва, вызов пайплайна ВСЁ ЕЩЁ ни один hook не запускает — только ВНУТРЕННЯЯ последовательность теперь enforced
    </div>

    <div style={{ height: 28 }} />
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', width: 1220 }}>
      {(Object.keys(STATUS_STYLE) as Status[]).map((k) => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 16, height: 16, borderRadius: 4, background: STATUS_STYLE[k].color }} />
          <div style={{ fontSize: 17, color: 'rgba(255,255,255,0.6)' }}>{STATUS_STYLE[k].label}</div>
        </div>
      ))}
    </div>
  </AbsoluteFill>
);
