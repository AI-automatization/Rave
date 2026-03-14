import { useEffect, useState, useCallback } from 'react';
import { logsApi } from '../api/logs.api';
import { Badge } from '../components/ui/Badge';
import { Select, Input } from '../components/ui/Input';
import { Pagination } from '../components/ui/Pagination';
import type { ApiLog, PaginationMeta } from '../types';

const levelVariant: Record<ApiLog['level'], 'green' | 'yellow' | 'red'> = {
  info: 'green', warn: 'yellow', error: 'red',
};

export function LogsPage() {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await logsApi.list({
        page, limit: 50,
        level: levelFilter || undefined,
        service: serviceFilter || undefined,
      });
      setLogs(res.data);
      setMeta(res.meta);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, levelFilter, serviceFilter]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-white">API Loglar</h1>
        <p className="text-text-muted text-sm mt-0.5">{meta.total.toLocaleString()} ta yozuv</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={levelFilter} onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }}>
          <option value="">Barcha darajalar</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
        </Select>
        <Input
          placeholder="Servis (auth, content...)"
          value={serviceFilter}
          onChange={(e) => { setServiceFilter(e.target.value); setPage(1); }}
          className="w-48"
        />
      </div>

      {/* Logs table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-text-muted font-medium font-sans text-xs">Vaqt</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium font-sans text-xs">Daraja</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium font-sans text-xs">Servis</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium font-sans text-xs">Xabar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-text-muted font-sans">Yuklanmoqda...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-text-muted font-sans">Log topilmadi</td></tr>
              ) : logs.map((log) => (
                <tr key={log._id} className="border-b border-border/50 hover:bg-overlay/50 transition-colors">
                  <td className="px-4 py-2 text-text-muted text-xs whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('uz-UZ')}
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant={levelVariant[log.level]}>{log.level}</Badge>
                  </td>
                  <td className="px-4 py-2 text-text-muted text-xs">{log.service ?? '—'}</td>
                  <td className="px-4 py-2 text-white text-xs max-w-xl truncate">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-4">
          <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onChange={setPage} />
        </div>
      </div>
    </div>
  );
}
