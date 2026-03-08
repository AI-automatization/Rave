import { redirect } from 'next/navigation';

// Search has been merged into the Movies page
export default function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q;
  redirect(q ? `/movies?q=${encodeURIComponent(q)}` : '/movies');
}
