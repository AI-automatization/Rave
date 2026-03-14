import { Button } from './Button';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, limit, onChange }: PaginationProps) {
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-1 py-2">
      <p className="text-xs text-text-muted">
        {from}–{to} / {total} ta
      </p>
      <div className="flex gap-1">
        <Button size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>← Oldingi</Button>
        <span className="px-3 py-1.5 text-xs text-text-muted">
          {page} / {totalPages}
        </span>
        <Button size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Keyingi →</Button>
      </div>
    </div>
  );
}
