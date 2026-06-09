import { useEffect, useState, useCallback, useRef } from 'react';
import { Database, Search, RefreshCw, Trash2, ChevronLeft, ChevronRight, X, Copy, Check, AlertTriangle } from 'lucide-react';
import { databaseApi, type CollectionInfo, type DocsResult } from '../api/database.api';
import { useAuthStore } from '../store/auth.store';

// ── JSON colour renderer ────────────────────────────────────────────────────
function JsonValue({ val, depth = 0 }: { val: unknown; depth?: number }) {
  if (val === null)      return <span className="text-[#a0a0c0]">null</span>;
  if (val === undefined) return <span className="text-[#a0a0c0]">undefined</span>;
  if (typeof val === 'boolean') return <span className="text-violet-400">{String(val)}</span>;
  if (typeof val === 'number')  return <span className="text-sky-400">{String(val)}</span>;
  if (typeof val === 'string')  return <span className="text-emerald-400">"{val}"</span>;

  if (typeof val === 'object' && '$oid' in (val as Record<string, unknown>)) {
    return <span className="text-yellow-400/80 text-[11px]">ObjectId("{String((val as Record<string, unknown>).$oid)}")</span>;
  }
  if (typeof val === 'object' && '$date' in (val as Record<string, unknown>)) {
    const d = (val as Record<string, unknown>).$date;
    const dt = typeof d === 'string' ? new Date(d).toLocaleString() : String(d);
    return <span className="text-orange-400/80 text-[11px]">Date({dt})</span>;
  }

  if (Array.isArray(val)) {
    if (val.length === 0) return <span className="text-[#a0a0c0]">[]</span>;
    if (depth > 2) return <span className="text-[#a0a0c0]">[…{val.length}]</span>;
    return (
      <span>
        {'['}
        <div className="pl-4 border-l border-white/[0.06] ml-1">
          {val.slice(0, 20).map((item, i) => (
            <div key={i}><JsonValue val={item} depth={depth + 1} />{i < val.length - 1 && <span className="text-[#555]">,</span>}</div>
          ))}
          {val.length > 20 && <div className="text-[#a0a0c0] text-[11px]">… {val.length - 20} more</div>}
        </div>
        {']'}
      </span>
    );
  }

  if (typeof val === 'object') {
    const entries = Object.entries(val as Record<string, unknown>);
    if (entries.length === 0) return <span className="text-[#a0a0c0]">{'{}'}</span>;
    if (depth > 2) return <span className="text-[#a0a0c0]">{'{'}{entries.length} fields{'}'}</span>;
    return (
      <span>
        {'{'}
        <div className="pl-4 border-l border-white/[0.06] ml-1">
          {entries.slice(0, 30).map(([k, v], i) => (
            <div key={k}>
              <span className="text-[#b0a8ff]">{k}</span>
              <span className="text-[#555]">: </span>
              <JsonValue val={v} depth={depth + 1} />
              {i < entries.length - 1 && <span className="text-[#555]">,</span>}
            </div>
          ))}
          {entries.length > 30 && <div className="text-[#a0a0c0] text-[11px]">… {entries.length - 30} more</div>}
        </div>
        {'}'}
      </span>
    );
  }
  return <span className="text-[#a0a0c0]">{String(val)}</span>;
}

// ── Document detail drawer ──────────────────────────────────────────────────
function DocDrawer({
  doc,
  collection,
  onClose,
  onDelete,
  isSuperAdmin,
}: {
  doc: Record<string, unknown>;
  collection: string;
  onClose: () => void;
  onDelete: (id: string) => void;
  isSuperAdmin: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const id = String((doc as Record<string, unknown>)._id ?? '');
  const plainId = id.replace(/^ObjectId\("(.+)"\)$/, '$1');
  const actualId = typeof doc._id === 'object' && doc._id !== null && '$oid' in (doc._id as object)
    ? String((doc._id as Record<string, string>).$oid)
    : plainId;

  const copy = () => {
    void navigator.clipboard.writeText(JSON.stringify(doc, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="w-[520px] bg-[#0c0c1e] border-l border-white/[0.07] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.07] shrink-0">
          <div className="min-w-0">
            <p className="text-white text-[13px] font-semibold truncate">{collection}</p>
            <p className="text-text-dim text-[11px] font-mono truncate">{actualId}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-3">
            <button onClick={copy} className="p-1.5 rounded-lg text-text-dim hover:text-white hover:bg-white/[0.05] transition-all" title="Copy JSON">
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            </button>
            {isSuperAdmin && (
              <button onClick={() => setConfirmDel(true)} className="p-1.5 rounded-lg text-text-dim hover:text-red-400 hover:bg-red-500/[0.08] transition-all" title="Delete">
                <Trash2 size={13} />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg text-text-dim hover:text-white hover:bg-white/[0.05] transition-all">
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Delete confirm */}
        {confirmDel && (
          <div className="mx-4 mt-4 p-3.5 bg-red-500/[0.08] border border-red-500/20 rounded-xl shrink-0">
            <div className="flex items-center gap-2 mb-2.5">
              <AlertTriangle size={13} className="text-red-400 shrink-0" />
              <p className="text-red-400 text-[12px] font-semibold">Удалить документ навсегда?</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { onDelete(actualId); setConfirmDel(false); }}
                className="flex-1 h-7 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-[12px] font-semibold rounded-lg transition-all">
                Удалить
              </button>
              <button onClick={() => setConfirmDel(false)}
                className="flex-1 h-7 bg-white/[0.05] hover:bg-white/[0.08] text-text-muted text-[12px] rounded-lg transition-all">
                Отмена
              </button>
            </div>
          </div>
        )}

        {/* JSON body */}
        <div className="flex-1 overflow-y-auto p-5 font-mono text-[12px] leading-relaxed">
          <JsonValue val={doc} />
        </div>
      </div>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function cellVal(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'object' && '$oid' in (v as object)) return String((v as Record<string, string>).$oid).slice(-8);
  if (typeof v === 'object' && '$date' in (v as object)) return new Date(String((v as Record<string, string>).$date)).toLocaleDateString();
  if (typeof v === 'object') return '{...}';
  if (Array.isArray(v)) return `[${(v as unknown[]).length}]`;
  const s = String(v);
  return s.length > 40 ? s.slice(0, 40) + '…' : s;
}

const PRIORITY_COLS = ['_id', 'email', 'username', 'name', 'title', 'type', 'status', 'role', 'createdAt', 'updatedAt'];

function deriveCols(docs: Record<string, unknown>[], max = 6): string[] {
  const all = new Set<string>();
  docs.forEach(d => Object.keys(d).forEach(k => all.add(k)));
  const sorted = [...all].sort((a, b) => {
    const ai = PRIORITY_COLS.indexOf(a), bi = PRIORITY_COLS.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });
  return sorted.slice(0, max);
}

// ── Main Page ────────────────────────────────────────────────────────────────
export function DatabasePage() {
  const isSuperAdmin = useAuthStore((s) => s.user?.role === 'superadmin');

  const [collections, setCollections]   = useState<CollectionInfo[]>([]);
  const [colLoading, setColLoading]     = useState(true);
  const [selected, setSelected]         = useState<string | null>(null);
  const [result, setResult]             = useState<DocsResult | null>(null);
  const [docsLoading, setDocsLoading]   = useState(false);
  const [search, setSearch]             = useState('');
  const [searchInput, setSearchInput]   = useState('');
  const [page, setPage]                 = useState(1);
  const [openDoc, setOpenDoc]           = useState<Record<string, unknown> | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  const loadCollections = useCallback(async () => {
    setColLoading(true);
    try { setCollections(await databaseApi.listCollections()); } catch { /* ignore */ }
    finally { setColLoading(false); }
  }, []);

  useEffect(() => { void loadCollections(); }, [loadCollections]);

  const loadDocs = useCallback(async (col: string, pg: number, q: string) => {
    setDocsLoading(true);
    try { setResult(await databaseApi.listDocuments(col, { page: pg, limit: 20, search: q })); }
    catch { setResult(null); }
    finally { setDocsLoading(false); }
  }, []);

  useEffect(() => {
    if (selected) { setPage(1); void loadDocs(selected, 1, search); }
  }, [selected, search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selected) void loadDocs(selected, page, search);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchChange = (v: string) => {
    setSearchInput(v);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(v), 400);
  };

  const handleDelete = async (id: string) => {
    if (!selected) return;
    try {
      await databaseApi.deleteDocument(selected, id);
      setOpenDoc(null);
      void loadDocs(selected, page, search);
      void loadCollections();
    } catch { /* ignore */ }
  };

  const cols = result?.documents.length ? deriveCols(result.documents) : [];

  return (
    <div className="flex h-full min-h-0 overflow-hidden">

      {/* Collections sidebar */}
      <aside className="w-[220px] shrink-0 border-r border-white/[0.055] flex flex-col overflow-hidden">
        <div className="px-3 pt-3 pb-2 shrink-0 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-text-dim uppercase tracking-wider">Collections</span>
          <button onClick={loadCollections} className="p-1 rounded text-text-dim hover:text-white transition-colors">
            <RefreshCw size={11} className={colLoading ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-1.5 pb-2">
          {colLoading && (
            <div className="px-2 py-3 text-text-dim text-[12px]">Загрузка...</div>
          )}
          {!colLoading && collections.map((c) => (
            <button
              key={c.name}
              onClick={() => setSelected(c.name)}
              className={`w-full text-left flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[12px] transition-all duration-100 ${
                selected === c.name
                  ? 'bg-accent/[0.12] text-white'
                  : 'text-[#6b6b8a] hover:bg-white/[0.04] hover:text-[#c4c3dc]'
              }`}
            >
              <span className="truncate flex-1">{c.name}</span>
              <span className={`ml-1.5 text-[10px] shrink-0 tabular-nums ${selected === c.name ? 'text-accent/70' : 'text-text-dim'}`}>
                {c.count.toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* Documents area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-text-dim">
            <Database size={36} strokeWidth={1.2} className="opacity-30" />
            <p className="text-[13px]">Выберите коллекцию</p>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="px-4 py-2.5 border-b border-white/[0.055] flex items-center gap-3 shrink-0">
              <div className="relative flex-1 max-w-xs">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
                <input
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="ID или поле..."
                  className="w-full h-7 bg-white/[0.04] border border-white/[0.07] rounded-lg pl-7 pr-3 text-[12px] text-white placeholder:text-text-dim focus:outline-none focus:border-accent/40 transition-colors"
                />
              </div>
              <span className="text-text-dim text-[12px] shrink-0">
                {result ? `${result.total.toLocaleString()} docs` : ''}
              </span>
              <button onClick={() => selected && void loadDocs(selected, page, search)}
                className="p-1.5 rounded-lg text-text-dim hover:text-white hover:bg-white/[0.05] transition-all">
                <RefreshCw size={12} className={docsLoading ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              {docsLoading && !result ? (
                <div className="p-6 text-text-dim text-[13px]">Загрузка...</div>
              ) : !result || result.documents.length === 0 ? (
                <div className="p-6 text-text-dim text-[13px]">Нет документов</div>
              ) : (
                <table className="w-full text-[12px] border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.055] sticky top-0 bg-[#0c0c1e] z-10">
                      {cols.map((c) => (
                        <th key={c} className="text-left px-3 py-2 text-[10px] font-semibold text-text-dim uppercase tracking-wide whitespace-nowrap">
                          {c}
                        </th>
                      ))}
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {result.documents.map((doc, i) => {
                      const rawId = doc._id;
                      const rowId = typeof rawId === 'object' && rawId !== null && '$oid' in (rawId as object)
                        ? String((rawId as Record<string, string>).$oid)
                        : String(rawId ?? i);
                      return (
                        <tr
                          key={rowId}
                          onClick={() => setOpenDoc(doc)}
                          className="border-b border-white/[0.04] hover:bg-white/[0.025] cursor-pointer transition-colors"
                        >
                          {cols.map((c) => (
                            <td key={c} className="px-3 py-2 text-[#c4c3dc] font-mono whitespace-nowrap max-w-[200px] truncate">
                              {cellVal(doc[c])}
                            </td>
                          ))}
                          <td className="px-2 py-2 text-text-dim">
                            <ChevronRight size={11} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {result && result.pages > 1 && (
              <div className="px-4 py-2.5 border-t border-white/[0.055] flex items-center justify-between shrink-0">
                <span className="text-[12px] text-text-dim">
                  Стр. {result.page} / {result.pages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-1.5 rounded-lg text-text-dim hover:text-white hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(result.pages, p + 1))}
                    disabled={page >= result.pages}
                    className="p-1.5 rounded-lg text-text-dim hover:text-white hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Document drawer */}
      {openDoc && (
        <DocDrawer
          doc={openDoc}
          collection={selected ?? ''}
          onClose={() => setOpenDoc(null)}
          onDelete={handleDelete}
          isSuperAdmin={!!isSuperAdmin}
        />
      )}
    </div>
  );
}
