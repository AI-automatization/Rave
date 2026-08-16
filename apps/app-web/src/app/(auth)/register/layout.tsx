// page.tsx is a client component (it holds the "verify email" step in state), so it cannot export
// metadata itself — hence this layout. Static uz title for the same reason as the other pages.
export const metadata = {
  title: "Ro'yxatdan o'tish",
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
