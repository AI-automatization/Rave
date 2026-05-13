import { useState } from 'react';

export const BLOCK_PRESETS = [
  'Рассылка спама и нежелательного контента',
  'Оскорбления и токсичное поведение',
  'Распространение запрещённого контента',
  'Мошенничество или фишинг',
  'Нарушение авторских прав',
  'Нарушение правил сообщества',
] as const;

export const BLOCK_REASON_FROM_REPORT: Record<string, string> = {
  prohibited_content: 'Размещение запрещённого контента в комнате просмотра',
  spam:               'Рассылка спама и нежелательного контента в Watch Party',
  violence:           'Пропаганда насилия и жестокого обращения в Watch Party',
  harassment:         'Оскорбления и преследование участников Watch Party',
  copyright:          'Нарушение авторских прав при совместном просмотре',
  other:              'Нарушение правил платформы',
};

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function BlockReasonPicker({ value, onChange, placeholder = 'Или введите вручную...' }: Props) {
  const [customMode, setCustomMode] = useState(!BLOCK_PRESETS.includes(value as typeof BLOCK_PRESETS[number]));

  const selectPreset = (preset: string) => {
    onChange(preset);
    setCustomMode(false);
  };

  return (
    <div className="space-y-3">
      {/* Preset chips */}
      <div className="flex flex-wrap gap-2">
        {BLOCK_PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => selectPreset(p)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
              value === p && !customMode
                ? 'bg-red-500/20 border-red-500/50 text-red-300'
                : 'bg-white/[0.04] border-white/[0.08] text-text-muted hover:text-white hover:border-white/20'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          onClick={() => { setCustomMode(true); onChange(''); }}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
            customMode
              ? 'bg-accent/20 border-accent/40 text-accent'
              : 'bg-white/[0.04] border-white/[0.08] text-text-dim hover:text-white'
          }`}
        >
          Другое
        </button>
      </div>

      {/* Custom input */}
      {customMode && (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          autoFocus
          className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-white placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 resize-none transition-all"
        />
      )}

      {/* Selected preview */}
      {!customMode && value && (
        <div className="flex items-start gap-2 px-3 py-2 bg-red-500/[0.06] border border-red-500/20 rounded-lg">
          <span className="text-xs text-red-400 leading-relaxed">{value}</span>
        </div>
      )}
    </div>
  );
}
