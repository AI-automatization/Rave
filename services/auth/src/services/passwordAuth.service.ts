// Re-export shim — the implementation lives in ./passwordAuth/ (split by flow: registration,
// login/sessions, password reset, change-password, account management), see #85. Kept as a
// separate file (not a same-named folder) so every existing `from './passwordAuth.service'`
// import keeps resolving here unchanged.
export { PasswordAuthService, generateUniqueUsername } from './passwordAuth/index';
