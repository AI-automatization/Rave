// 2026-11-11 team-lead decision (Polat): no virtual browser on our server — VB runs only on the
// viewer's own machine (desktop/mobile apps). Mirrors the backend kill-switch SERVER_VB_ENABLED
// (services/watch-party/src/services/virtualBrowser.service.ts). Off by default: every server-VB
// button and auto-retry in the web room is hidden, since the backend would only answer
// "unreachable". Turning server VB back on needs both: SERVER_VB=on on media AND
// NEXT_PUBLIC_SERVER_VB=on here (inlined at build time → rebuild app-web).
export const SERVER_VB_ENABLED = process.env.NEXT_PUBLIC_SERVER_VB === 'on';
