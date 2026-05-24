import { useEffect, useState, useCallback } from 'react';
import {
  Settings, ToggleLeft, ToggleRight, Save, RefreshCw, Smartphone,
  Mail, Users, Tv2, Swords, Clock, AlertTriangle, CheckCircle,
} from 'lucide-react';
import { settingsApi, AppSettings } from '../api/settings.api';

function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className={`flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-xl border transition-all ${
        value
          ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400'
          : 'bg-white/[0.05] border-white/[0.1] text-text-muted'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:brightness-110'}`}
    >
      {value ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
      {value ? 'Вкл' : 'Выкл'}
    </button>
  );
}

interface SettingRowProps {
  label: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  saving?: boolean;
}

function SettingRow({ label, description, icon, children, saving }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-white/[0.05] last:border-0">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0 mt-0.5">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="text-xs text-text-muted mt-0.5">{description}</p>
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        {saving && <RefreshCw size={12} className="text-text-dim animate-spin" />}
        {children}
      </div>
    </div>
  );
}

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [saved, setSaved]       = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await settingsApi.getAll();
      setSettings(s);
    } catch {
      setError('Не удалось загрузить настройки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const update = async (key: keyof AppSettings, value: unknown) => {
    if (!settings) return;
    setSettings((prev) => prev ? { ...prev, [key]: value } : prev);
    setSaving(key);
    try {
      await settingsApi.set(key, value);
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    } catch {
      setSettings((prev) => prev ? { ...prev } : prev);
      setError(`Не удалось сохранить ${key}`);
    } finally {
      setSaving(null);
    }
  };

  const [editingEmail, setEditingEmail] = useState(false);
  const [emailDraft, setEmailDraft]     = useState('');
  const [editingIos, setEditingIos]     = useState(false);
  const [iosDraft, setIosDraft]         = useState('');
  const [editingAndroid, setEditingAndroid] = useState(false);
  const [androidDraft, setAndroidDraft] = useState('');
  const [editingRoom, setEditingRoom]       = useState(false);
  const [roomSizeDraft, setRoomSizeDraft]   = useState('');
  const [editingDur, setEditingDur]         = useState(false);
  const [durDraft, setDurDraft]             = useState('');

  if (loading) {
    return (
      <div className="flex flex-col gap-5 animate-fade-in">
        <div className="flex items-center gap-3">
          <Settings size={22} className="text-accent" />
          <h1 className="text-2xl font-bold text-white">Settings</h1>
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 bg-card rounded-2xl animate-pulse border border-white/[0.06]" />
        ))}
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex flex-col gap-5 animate-fade-in">
        <div className="flex items-center gap-3">
          <Settings size={22} className="text-accent" />
          <h1 className="text-2xl font-bold text-white">Settings</h1>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 flex items-center gap-2">
          <AlertTriangle size={15} /> {error ?? 'Ошибка загрузки'}
          <button onClick={() => void load()} className="ml-auto text-red-300 hover:text-white underline text-xs">Повторить</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings size={22} className="text-accent" />
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-text-muted text-sm mt-0.5">Глобальные настройки приложения</p>
          </div>
        </div>
        <button
          onClick={() => void load()}
          className="flex items-center gap-1.5 text-[12px] text-text-dim hover:text-white px-3 py-1.5 rounded-xl border border-white/[0.07] hover:border-white/[0.12] transition-colors"
        >
          <RefreshCw size={12} /> Обновить
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 flex items-center gap-2">
          <AlertTriangle size={15} /> {error}
        </div>
      )}
      {saved && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-emerald-400 flex items-center gap-2">
          <CheckCircle size={15} /> Сохранено
        </div>
      )}

      {/* App State */}
      <div className="bg-card rounded-2xl border border-white/[0.06] shadow-card px-5">
        <p className="text-[11px] font-semibold text-text-dim uppercase tracking-wider py-3 border-b border-white/[0.05]">
          Состояние приложения
        </p>

        <SettingRow
          label="Режим обслуживания"
          description="Отключает вход для всех пользователей, кроме администраторов"
          icon={<AlertTriangle size={15} className="text-amber-400" />}
          saving={saving === 'maintenanceMode'}
        >
          <Toggle value={settings.maintenanceMode} onChange={(v) => void update('maintenanceMode', v)} disabled={saving === 'maintenanceMode'} />
        </SettingRow>

        <SettingRow
          label="Регистрация"
          description="Разрешить новым пользователям создавать аккаунты"
          icon={<Users size={15} className="text-accent" />}
          saving={saving === 'registrationEnabled'}
        >
          <Toggle value={settings.registrationEnabled} onChange={(v) => void update('registrationEnabled', v)} disabled={saving === 'registrationEnabled'} />
        </SettingRow>
      </div>

      {/* Features */}
      <div className="bg-card rounded-2xl border border-white/[0.06] shadow-card px-5">
        <p className="text-[11px] font-semibold text-text-dim uppercase tracking-wider py-3 border-b border-white/[0.05]">
          Функции
        </p>

        <SettingRow
          label="Watch Parties"
          description="Совместный просмотр видео в реальном времени"
          icon={<Tv2 size={15} className="text-purple-400" />}
          saving={saving === 'watchPartiesEnabled'}
        >
          <Toggle value={settings.watchPartiesEnabled} onChange={(v) => void update('watchPartiesEnabled', v)} disabled={saving === 'watchPartiesEnabled'} />
        </SettingRow>

        <SettingRow
          label="Battles"
          description="Соревновательные баттлы между пользователями"
          icon={<Swords size={15} className="text-rose-400" />}
          saving={saving === 'battlesEnabled'}
        >
          <Toggle value={settings.battlesEnabled} onChange={(v) => void update('battlesEnabled', v)} disabled={saving === 'battlesEnabled'} />
        </SettingRow>
      </div>

      {/* Room Limits */}
      <div className="bg-card rounded-2xl border border-white/[0.06] shadow-card px-5">
        <p className="text-[11px] font-semibold text-text-dim uppercase tracking-wider py-3 border-b border-white/[0.05]">
          Ограничения комнат
        </p>

        <SettingRow
          label="Макс. участников в комнате"
          description="Максимальное количество пользователей в одной watch party"
          icon={<Users size={15} className="text-text-muted" />}
          saving={saving === 'maxRoomSize'}
        >
          {editingRoom ? (
            <div className="flex items-center gap-1.5">
              <input
                value={roomSizeDraft}
                onChange={(e) => setRoomSizeDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const n = parseInt(roomSizeDraft, 10);
                    if (n > 0) { void update('maxRoomSize', n); setEditingRoom(false); }
                  }
                  if (e.key === 'Escape') setEditingRoom(false);
                }}
                className="w-16 bg-surface border border-border rounded-lg px-2 py-1 text-sm text-white text-center focus:outline-none focus:ring-1 focus:ring-accent/40"
                autoFocus
              />
              <button onClick={() => { const n = parseInt(roomSizeDraft, 10); if (n > 0) { void update('maxRoomSize', n); } setEditingRoom(false); }}
                className="text-[11px] px-2 py-1 rounded-lg bg-accent/15 text-accent hover:bg-accent/25 transition-colors">
                <Save size={11} />
              </button>
            </div>
          ) : (
            <button onClick={() => { setRoomSizeDraft(String(settings.maxRoomSize)); setEditingRoom(true); }}
              className="text-sm font-mono font-semibold text-white bg-white/[0.07] hover:bg-white/[0.1] border border-white/[0.1] rounded-lg px-3 py-1 transition-colors">
              {settings.maxRoomSize}
            </button>
          )}
        </SettingRow>

        <SettingRow
          label="Макс. длительность (часов)"
          description="После этого времени комната автоматически закрывается"
          icon={<Clock size={15} className="text-text-muted" />}
          saving={saving === 'maxRoomDurationHours'}
        >
          {editingDur ? (
            <div className="flex items-center gap-1.5">
              <input
                value={durDraft}
                onChange={(e) => setDurDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const n = parseFloat(durDraft);
                    if (n > 0) { void update('maxRoomDurationHours', n); setEditingDur(false); }
                  }
                  if (e.key === 'Escape') setEditingDur(false);
                }}
                className="w-16 bg-surface border border-border rounded-lg px-2 py-1 text-sm text-white text-center focus:outline-none focus:ring-1 focus:ring-accent/40"
                autoFocus
              />
              <button onClick={() => { const n = parseFloat(durDraft); if (n > 0) { void update('maxRoomDurationHours', n); } setEditingDur(false); }}
                className="text-[11px] px-2 py-1 rounded-lg bg-accent/15 text-accent hover:bg-accent/25 transition-colors">
                <Save size={11} />
              </button>
            </div>
          ) : (
            <button onClick={() => { setDurDraft(String(settings.maxRoomDurationHours)); setEditingDur(true); }}
              className="text-sm font-mono font-semibold text-white bg-white/[0.07] hover:bg-white/[0.1] border border-white/[0.1] rounded-lg px-3 py-1 transition-colors">
              {settings.maxRoomDurationHours}ч
            </button>
          )}
        </SettingRow>
      </div>

      {/* Mobile versions */}
      <div className="bg-card rounded-2xl border border-white/[0.06] shadow-card px-5">
        <p className="text-[11px] font-semibold text-text-dim uppercase tracking-wider py-3 border-b border-white/[0.05]">
          Минимальная версия приложения
        </p>

        <SettingRow
          label="iOS — минимальная версия"
          description="Пользователи со старой версией получат предупреждение об обновлении"
          icon={<Smartphone size={15} className="text-text-muted" />}
          saving={saving === 'minAppVersionIos'}
        >
          {editingIos ? (
            <div className="flex items-center gap-1.5">
              <input
                value={iosDraft}
                onChange={(e) => setIosDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { void update('minAppVersionIos', iosDraft.trim()); setEditingIos(false); }
                  if (e.key === 'Escape') setEditingIos(false);
                }}
                className="w-24 bg-surface border border-border rounded-lg px-2 py-1 text-sm text-white text-center font-mono focus:outline-none focus:ring-1 focus:ring-accent/40"
                autoFocus
              />
              <button onClick={() => { void update('minAppVersionIos', iosDraft.trim()); setEditingIos(false); }}
                className="text-[11px] px-2 py-1 rounded-lg bg-accent/15 text-accent hover:bg-accent/25 transition-colors">
                <Save size={11} />
              </button>
            </div>
          ) : (
            <button onClick={() => { setIosDraft(settings.minAppVersionIos); setEditingIos(true); }}
              className="text-sm font-mono font-semibold text-white bg-white/[0.07] hover:bg-white/[0.1] border border-white/[0.1] rounded-lg px-3 py-1 transition-colors">
              v{settings.minAppVersionIos}
            </button>
          )}
        </SettingRow>

        <SettingRow
          label="Android — минимальная версия"
          description="Пользователи со старой версией получат предупреждение об обновлении"
          icon={<Smartphone size={15} className="text-text-muted" />}
          saving={saving === 'minAppVersionAndroid'}
        >
          {editingAndroid ? (
            <div className="flex items-center gap-1.5">
              <input
                value={androidDraft}
                onChange={(e) => setAndroidDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { void update('minAppVersionAndroid', androidDraft.trim()); setEditingAndroid(false); }
                  if (e.key === 'Escape') setEditingAndroid(false);
                }}
                className="w-24 bg-surface border border-border rounded-lg px-2 py-1 text-sm text-white text-center font-mono focus:outline-none focus:ring-1 focus:ring-accent/40"
                autoFocus
              />
              <button onClick={() => { void update('minAppVersionAndroid', androidDraft.trim()); setEditingAndroid(false); }}
                className="text-[11px] px-2 py-1 rounded-lg bg-accent/15 text-accent hover:bg-accent/25 transition-colors">
                <Save size={11} />
              </button>
            </div>
          ) : (
            <button onClick={() => { setAndroidDraft(settings.minAppVersionAndroid); setEditingAndroid(true); }}
              className="text-sm font-mono font-semibold text-white bg-white/[0.07] hover:bg-white/[0.1] border border-white/[0.1] rounded-lg px-3 py-1 transition-colors">
              v{settings.minAppVersionAndroid}
            </button>
          )}
        </SettingRow>
      </div>

      {/* Contact */}
      <div className="bg-card rounded-2xl border border-white/[0.06] shadow-card px-5">
        <p className="text-[11px] font-semibold text-text-dim uppercase tracking-wider py-3 border-b border-white/[0.05]">
          Контакты
        </p>

        <SettingRow
          label="Email поддержки"
          description="Отображается пользователям в приложении как контакт поддержки"
          icon={<Mail size={15} className="text-text-muted" />}
          saving={saving === 'contactEmail'}
        >
          {editingEmail ? (
            <div className="flex items-center gap-1.5">
              <input
                value={emailDraft}
                onChange={(e) => setEmailDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { void update('contactEmail', emailDraft.trim()); setEditingEmail(false); }
                  if (e.key === 'Escape') setEditingEmail(false);
                }}
                className="w-48 bg-surface border border-border rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent/40"
                autoFocus
              />
              <button onClick={() => { void update('contactEmail', emailDraft.trim()); setEditingEmail(false); }}
                className="text-[11px] px-2 py-1 rounded-lg bg-accent/15 text-accent hover:bg-accent/25 transition-colors">
                <Save size={11} />
              </button>
            </div>
          ) : (
            <button onClick={() => { setEmailDraft(settings.contactEmail); setEditingEmail(true); }}
              className="text-sm text-white bg-white/[0.07] hover:bg-white/[0.1] border border-white/[0.1] rounded-lg px-3 py-1 transition-colors truncate max-w-[220px]">
              {settings.contactEmail}
            </button>
          )}
        </SettingRow>
      </div>
    </div>
  );
}
