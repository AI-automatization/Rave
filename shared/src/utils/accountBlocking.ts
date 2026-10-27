// Account blocking is switched off platform-wide (2026-10-27, Javod's decision): blocked flags
// in DB/Redis no longer stop login or API access. Set ACCOUNT_BLOCKING_ENABLED=1 to turn it back on.
export function isAccountBlockingEnabled(): boolean {
  return process.env.ACCOUNT_BLOCKING_ENABLED === '1';
}
