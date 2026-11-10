'use client';

import { useEffect, useRef } from 'react';

type Rect = { x: number; y: number; width: number; height: number };

// The app paints the VB ABOVE the page, so a dialog or menu of the page opening over the video box would be hidden behind it.
// While one is open the box reports "hidden" and the app moves the VB behind the page (it keeps streaming).
const DIALOGS = '[role="dialog"], [role="alertdialog"]';
const MENUS = '[role="menu"], [role="listbox"]';
function overlayOpen(box: DOMRect): boolean {
  if (document.querySelector(DIALOGS)) return true;
  return Array.from(document.querySelectorAll(MENUS)).some((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.right > box.left && r.left < box.right && r.bottom > box.top && r.top < box.bottom;
  });
}

// Desktop app, owner: the VB page is painted by the app itself exactly over this box (hooks/use-desktop-screen-share.ts,
// docked mode), so the owner uses the film site right here while the room gets its picture + sound. This component only
// keeps the app told where the box is.
export function DesktopVbDock({ setRect, label }: { setRect: (rect: Rect | null) => void; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const setRectRef = useRef(setRect);
  useEffect(() => { setRectRef.current = setRect; }, [setRect]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let last = '';
    const report = () => {
      const r = el.getBoundingClientRect();
      const hidden = overlayOpen(r);
      const rect = { x: Math.round(r.left), y: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) };
      const key = hidden ? 'hidden' : `${rect.x},${rect.y},${rect.width},${rect.height}`;
      if (key === last) return;
      last = key;
      setRectRef.current(hidden ? null : rect);
    };
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    window.addEventListener('resize', report);
    window.addEventListener('scroll', report, true);
    const mo = new MutationObserver(report); // a dialog or menu opened / closed
    mo.observe(document.body, { childList: true, subtree: true });
    const timer = window.setInterval(report, 500); // layout shifts nothing above tells us about
    return () => {
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener('resize', report);
      window.removeEventListener('scroll', report, true);
      window.clearInterval(timer);
      setRectRef.current(null);
    };
  }, []);

  return (
    <div ref={ref} className="relative aspect-video w-full overflow-hidden rounded-[var(--ww-r-lg)] bg-black" data-testid="desktop-vb-dock">
      <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-[11px] text-white">{label}</span>
    </div>
  );
}
