// The marketing pages in this group are the only ones that do not carry their
// own <main>: they are section lists rendered straight into the page. The nav
// and footer around them come from the locale layout (SiteShell).
export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <main className="flex-1" id="main-content">{children}</main>;
}
