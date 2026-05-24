import { useEffect, useState, useCallback, useRef, KeyboardEvent } from 'react';
import { ShieldAlert, X, Plus, Loader2 } from 'lucide-react';
import { bannedWordsApi, type BannedWordCategory, type BannedWordEntry } from '../api/bannedWords.api';
import { FilterTabs } from '../components/ui/FilterTabs';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';

const TABS: { value: BannedWordCategory; label: string }[] = [
  { value: 'room_name', label: 'Room Names' },
  { value: 'chat',      label: 'Chat' },
];

const CATEGORY_DESCRIPTION: Record<BannedWordCategory, string> = {
  room_name: 'Room names containing these words will be auto-flagged as suspicious.',
  chat:      'Chat messages containing these words will be blurred for other users.',
};

export function BannedWordsPage() {
  const [category, setCategory] = useState<BannedWordCategory>('room_name');
  const [words, setWords]       = useState<BannedWordEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [input, setInput]       = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError]     = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bannedWordsApi.list({ category, limit: 200 });
      setWords(res.words);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [category]);

  useEffect(() => { void load(); }, [load]);

  const handleTabChange = (val: string) => {
    setCategory(val as BannedWordCategory);
    setInput('');
    setAddError('');
  };

  const handleAdd = async () => {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) { setAddError('Enter a word'); return; }
    if (words.some((w) => w.word === trimmed)) {
      setAddError('Word already exists');
      return;
    }
    setAddLoading(true);
    setAddError('');
    try {
      await bannedWordsApi.add(trimmed, category);
      setInput('');
      await load();
      inputRef.current?.focus();
    } catch {
      setAddError('Failed to add word');
    } finally {
      setAddLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') void handleAdd();
  };

  const handleDelete = async (id: string, word: string) => {
    if (!window.confirm(`Remove "${word}" from banned words?`)) return;
    setDeletingId(id);
    try {
      await bannedWordsApi.delete(id);
      setWords((prev) => prev.filter((w) => w._id !== id));
    } catch { /* silent */ }
    finally { setDeletingId(null); }
  };

  const activeWords = words.filter((w) => w.active);

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <PageHeader
        title="Banned Words"
        meta={`${activeWords.length} active word${activeWords.length !== 1 ? 's' : ''}`}
      />

      {/* Tabs */}
      <FilterTabs options={TABS} value={category} onChange={handleTabChange} />

      {/* Description */}
      <p className="text-[13px] text-text-dim leading-relaxed">
        {CATEGORY_DESCRIPTION[category]}
      </p>

      {/* Add word form */}
      <div className="bg-card rounded-2xl shadow-card p-4 flex flex-col gap-3">
        <p className="text-[11px] font-semibold text-text-dim uppercase tracking-[0.08em]">
          Add Word
        </p>
        <div className="flex items-center gap-2.5">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); setAddError(''); }}
            onKeyDown={handleKeyDown}
            placeholder={category === 'room_name' ? 'e.g. inappropriate' : 'e.g. slur'}
            className="input-base flex-1"
            disabled={addLoading}
          />
          <Button variant="primary" size="sm" loading={addLoading} onClick={() => void handleAdd()}>
            <Plus size={13} className="mr-1" />
            Add
          </Button>
        </div>
        {addError && (
          <p className="text-red-400 text-[12px]">{addError}</p>
        )}
      </div>

      {/* Word list */}
      <div className="bg-card rounded-2xl shadow-card p-4 flex flex-col gap-3">
        <p className="text-[11px] font-semibold text-text-dim uppercase tracking-[0.08em]">
          {category === 'room_name' ? 'Room Name' : 'Chat'} Banned Words
          <span className="ml-2 font-normal normal-case text-text-ghost">
            ({words.length})
          </span>
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} className="animate-spin text-text-dim" />
          </div>
        ) : words.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="w-11 h-11 rounded-2xl bg-white/[0.04] flex items-center justify-center">
              <ShieldAlert size={20} className="text-text-dim" />
            </div>
            <p className="text-text-muted text-sm font-medium">No banned words yet</p>
            <p className="text-text-dim text-xs">Add words using the form above</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {words.map((w) => (
              <span
                key={w._id}
                className="inline-flex items-center gap-1.5 bg-white/[0.06] border border-white/[0.1] rounded-lg px-2.5 py-1 text-[12px] font-mono text-text-muted"
              >
                {w.word}
                <button
                  onClick={() => void handleDelete(w._id, w.word)}
                  disabled={deletingId === w._id}
                  className="text-text-dim hover:text-red-400 transition-colors disabled:opacity-40 ml-0.5"
                  title={`Remove "${w.word}"`}
                >
                  {deletingId === w._id ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <X size={11} />
                  )}
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
