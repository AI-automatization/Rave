// Renderer of the native sign-in screens (login, register + e-mail code, forgot / reset password). A plain browser
// script: no imports, no frameworks. All text is set with textContent — never innerHTML. It only hands the values the
// user typed to the main process (window.wewatchAuth) and draws the answer; it never builds a URL and never sees a token.
// The rules and the flow are the web app's (apps/app-web/src/app/(auth)/...), see src/main/auth-model.ts.

// Wrapped in a function so this script's names do not collide with the other renderer scripts (all are plain scripts).
(() => {
type Strings = Record<string, string> & { lang: 'uz' | 'ru' };
type Entry = 'login' | 'register' | 'forgot' | 'reset';
interface AuthData {
  strings: Strings;
  /** True when the screen is (re)entered: start on `screen` with empty fields. False: only the language changed. */
  fresh: boolean;
  screen: Entry;
  /** The reset link that opened this screen carried a usable token. */
  hasToken: boolean;
  googleWaiting: boolean;
}
type Outcome =
  | { ok: true }
  | { ok: false; kind: string; message?: string; reason?: string | null };
interface GoogleResult {
  kind: 'ok' | 'blocked' | 'error' | 'cancelled';
  reason?: string;
}
interface AuthBridge {
  ready(): Promise<unknown>;
  login(email: string, password: string): Promise<Outcome>;
  register(username: string, email: string, password: string): Promise<Outcome>;
  confirm(email: string, code: string): Promise<Outcome>;
  forgot(email: string): Promise<Outcome>;
  reset(password: string, confirm: string): Promise<Outcome>;
  google(): Promise<GoogleResult>;
  cancelGoogle(): Promise<unknown>;
  help(): Promise<unknown>;
  about(): Promise<unknown>;
  onData(cb: (d: AuthData) => void): () => void;
}

type View = 'login' | 'register' | 'verify' | 'forgot' | 'forgotSent' | 'reset' | 'resetInvalid' | 'resetDone' | 'google';

// The web forms' rules (shared PATTERNS; main checks them again before anything is sent).
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
const PASSWORD_RE = /^[\s\S]{6,128}$/;
const PASSWORD_MIN = 6;
const CODE_LENGTH = 6;
const RESEND_COOLDOWN_S = 60;

const bridge = (window as unknown as { wewatchAuth: AuthBridge }).wewatchAuth;
const root = document.getElementById('root') as HTMLElement;

const blankCode = (): string[] => Array.from({ length: CODE_LENGTH }, () => '');
const st = {
  view: 'login' as View,
  S: null as Strings | null,
  email: '',
  password: '',
  username: '',
  regEmail: '',
  regPassword: '',
  verifyEmail: '',
  code: blankCode(),
  forgotEmail: '',
  sentTo: '',
  newPw: '',
  confirmPw: '',
  busy: false,
  error: null as Outcome | null,
  resendLeft: 0,
  resending: false,
  focus: '' as string, // name of the input to focus after the next render
};
let resendTimer: number | undefined;

const s = (key: string, vars: Record<string, string | number> = {}): string =>
  (st.S?.[key] ?? '').replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));

// ---------------------------------------------------------------- tiny DOM helpers

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

type Shape = [tag: string, attrs: Record<string, string>];
const SVG_NS = 'http://www.w3.org/2000/svg';
const P = (d: string): Shape => ['path', { d }];
// lucide line icons (24 px grid), the ones the web sign-in page uses
const ICONS: Record<string, Shape[]> = {
  mail: [['rect', { x: '2', y: '4', width: '20', height: '16', rx: '2' }], P('m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7')],
  lock: [['rect', { x: '3', y: '11', width: '18', height: '11', rx: '2' }], P('M7 11V7a5 5 0 0 1 10 0v4')],
  user: [['circle', { cx: '12', cy: '8', r: '5' }], P('M20 21a8 8 0 0 0-16 0')],
  eye: [P('M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0'), ['circle', { cx: '12', cy: '12', r: '3' }]],
  eyeOff: [P('M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68'), P('M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61'), P('M14.084 14.158a3 3 0 0 1-4.242-4.242'), P('m2 2 20 20')],
  arrowRight: [P('M5 12h14'), P('m12 5 7 7-7 7')],
  arrowLeft: [P('m12 19-7-7 7-7'), P('M19 12H5')],
  mailCheck: [P('M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8'), P('m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7'), P('m16 19 2 2 4-4')],
  shieldX: [P('M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z'), P('m14.5 9.5-5 5'), P('m9.5 9.5 5 5')],
  checkCircle: [['circle', { cx: '12', cy: '12', r: '10' }], P('m9 12 2 2 4-4')],
  loader: [P('M21 12a9 9 0 1 1-6.219-8.56')],
};
function icon(name: string, cls?: string): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  if (cls) svg.setAttribute('class', cls);
  for (const [tag, attrs] of ICONS[name] ?? []) {
    const e = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    svg.appendChild(e);
  }
  return svg;
}
/** Filled shapes (the WeWatch mark, the Google "G"): [tag, attrs] with their own colours. */
function shapes(viewBox: string, list: Shape[], w: string, h: string): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('width', w);
  svg.setAttribute('height', h);
  svg.setAttribute('aria-hidden', 'true');
  for (const [tag, attrs] of list) {
    const e = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    svg.appendChild(e);
  }
  return svg;
}
// The WeWatch mark of the toolbar (src/renderer/shell.html).
const LOGO: Shape[] = [
  ['path', { d: 'M101 11 70 79 54 43 36 11', stroke: '#7C3AED', 'stroke-width': '22', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }],
  ['path', { d: 'M11 11l31 68 17.5-37L76 11', stroke: '#A78BFA', 'stroke-width': '22', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }],
];
// The web button's Google "G" (LoginForm.tsx).
const GOOGLE: Shape[] = [
  ['path', { d: 'M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z', fill: '#4285F4' }],
  ['path', { d: 'M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z', fill: '#34A853' }],
  ['path', { d: 'M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z', fill: '#FBBC05' }],
  ['path', { d: 'M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z', fill: '#EA4335' }],
];

function button(cls: string, text: string, onClick: () => void): HTMLButtonElement {
  const b = el('button', cls, text);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}
const link = (text: string, onClick: () => void): HTMLButtonElement => button('link', text, onClick);

interface FieldOpts {
  label: string;
  name: string;
  type: 'text' | 'email' | 'password';
  icon: string;
  value: string;
  placeholder?: string;
  autocomplete: string;
  action?: HTMLElement;
  hint?: string;
  /** The value may be changed before it is stored (the web trims the user name on every keystroke). */
  clean?: (v: string) => string;
  onInput: (v: string) => void;
}
interface Field {
  root: HTMLElement;
  input: HTMLInputElement;
  /** Shows the field's own message (null hides it). */
  setError(text: string | null): void;
}
function field(o: FieldOpts): Field {
  const root = el('div', 'field');
  const row = el('div', 'label-row');
  const label = el('label', 'label', o.label);
  const id = `f-${o.name}`;
  label.htmlFor = id;
  row.appendChild(label);
  if (o.action) row.appendChild(o.action);
  root.appendChild(row);
  const control = el('div', 'control');
  control.appendChild(icon(o.icon));
  const input = el('input');
  input.id = id;
  input.name = o.name;
  input.type = o.type;
  input.value = o.value;
  input.setAttribute('autocomplete', o.autocomplete);
  input.spellcheck = false;
  input.autocapitalize = 'off';
  if (o.type === 'email') input.inputMode = 'email';
  if (o.placeholder) input.placeholder = o.placeholder;
  input.maxLength = o.type === 'password' ? 1024 : 254;
  input.addEventListener('input', () => {
    const v = o.clean ? o.clean(input.value) : input.value;
    if (v !== input.value) input.value = v;
    clearError();
    o.onInput(v);
  });
  control.appendChild(input);
  if (o.type === 'password') {
    input.classList.add('has-toggle');
    const eye = el('button', 'eye');
    eye.type = 'button';
    const paint = (): void => {
      const shown = input.type === 'text';
      eye.replaceChildren(icon(shown ? 'eyeOff' : 'eye'));
      eye.setAttribute('aria-label', s(shown ? 'hidePassword' : 'showPassword'));
      eye.title = s(shown ? 'hidePassword' : 'showPassword');
      eye.setAttribute('aria-pressed', String(shown));
    };
    eye.addEventListener('click', () => {
      input.type = input.type === 'password' ? 'text' : 'password';
      paint();
      input.focus();
    });
    paint();
    control.appendChild(eye);
  }
  root.appendChild(control);
  const err = el('p', 'field-error');
  err.hidden = true;
  root.appendChild(err);
  let hint: HTMLElement | null = null;
  if (o.hint) {
    hint = el('p', 'hint', o.hint);
    root.appendChild(hint);
  }
  return {
    root,
    input,
    setError(text) {
      err.textContent = text ?? '';
      err.hidden = text === null;
      if (hint) hint.hidden = text !== null;
      input.setAttribute('aria-invalid', String(text !== null));
    },
  };
}

// ---------------------------------------------------------------- messages

/** The notice for the last failed request (null = none). */
function notice(): HTMLElement {
  const box = el('div', 'notice');
  box.setAttribute('role', 'alert');
  box.hidden = true;
  const e = st.error;
  if (!e || e.ok) return box;
  box.hidden = false;
  if (e.kind === 'blocked') {
    box.appendChild(el('strong', undefined, s('bannedTitle')));
    if (e.reason) box.appendChild(el('p', undefined, s('bannedReason', { reason: e.reason })));
    box.appendChild(el('p', 'muted', s('bannedHint')));
  } else {
    box.textContent = e.kind === 'message' && e.message ? e.message : s(e.kind === 'invalid' ? 'genericError' : e.kind) || s('genericError');
  }
  return box;
}
let noticeBox: HTMLElement | null = null;
/** Typing again hides the last server message (the web forms do the same). */
function clearError(): void {
  st.error = null;
  if (noticeBox) noticeBox.hidden = true;
}

function primary(text: string, busyText: string, arrow = true): HTMLButtonElement {
  const b = el('button', 'btn primary');
  b.type = 'submit';
  if (st.busy) {
    b.appendChild(icon('loader', 'spin'));
    b.appendChild(el('span', undefined, busyText));
  } else {
    b.appendChild(el('span', undefined, text));
    if (arrow) b.appendChild(icon('arrowRight', 'arrow'));
  }
  return b;
}

function head(title: string, sub: string, center = false): HTMLElement {
  const h = el('header', center ? 'head center' : 'head');
  h.appendChild(el('h1', undefined, title));
  h.appendChild(el('p', 'sub', sub));
  return h;
}
function medal(name: string, tone = ''): HTMLElement {
  const m = el('span', tone ? `medal ${tone}` : 'medal');
  m.appendChild(icon(name));
  return m;
}

// ---------------------------------------------------------------- screens

function go(view: View): void {
  st.view = view;
  st.error = null;
  st.busy = false;
  render();
}

/** Run one request: busy while it runs, then the outcome is drawn. */
async function run(req: () => Promise<Outcome>, onOk: () => void): Promise<void> {
  if (st.busy) return;
  st.busy = true;
  st.error = null;
  render();
  let r: Outcome;
  try {
    r = await req();
  } catch {
    r = { ok: false, kind: 'genericError' };
  }
  st.busy = false;
  if (r.ok) onOk();
  else st.error = r;
  render();
}

function loginScreen(card: HTMLElement): void {
  card.appendChild(head(s('welcomeBack'), s('welcomeBackSub')));

  const google = el('button', 'btn google');
  google.type = 'button';
  google.setAttribute('aria-label', s('continueWithGoogle'));
  google.appendChild(shapes('0 0 24 24', GOOGLE, '17', '17'));
  google.appendChild(el('span', undefined, s('google')));
  google.disabled = st.busy;
  google.addEventListener('click', () => void startGoogle());
  card.appendChild(google);

  const div = el('div', 'divider');
  div.setAttribute('aria-hidden', 'true');
  div.appendChild(el('i'));
  div.appendChild(el('span', undefined, s('orDivider')));
  div.appendChild(el('i'));
  card.appendChild(div);

  const form = el('form');
  form.noValidate = true;
  const submit = primary(s('login'), s('login'));
  const sync = (): void => {
    submit.disabled = st.busy || st.email === '' || st.password === '';
  };
  const email = field({ label: s('emailLabel'), name: 'email', type: 'email', icon: 'mail', value: st.email, placeholder: s('emailPlaceholder'), autocomplete: 'email', onInput: (v) => { st.email = v; sync(); } });
  const pw = field({
    label: s('passwordLabel'), name: 'password', type: 'password', icon: 'lock', value: st.password, placeholder: s('passwordPlaceholder'), autocomplete: 'current-password',
    action: link(s('forgotPassword'), () => { st.forgotEmail = st.email; go('forgot'); }),
    onInput: (v) => { st.password = v; sync(); },
  });
  form.append(email.root, pw.root);
  noticeBox = notice();
  form.append(noticeBox, submit);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (st.busy || st.email === '' || st.password === '') return;
    void run(() => bridge.login(st.email, st.password), () => { st.password = ''; });
  });
  sync();
  card.appendChild(form);

  const sw = el('p', 'switch', `${s('noAccount')} `);
  sw.appendChild(link(s('registerLink'), () => go('register')));
  card.appendChild(sw);
  if (!st.focus) st.focus = st.error ? 'password' : 'email';
}

function strengthOf(pw: string): 'weak' | 'okay' | 'strong' | null {
  if (pw.length === 0) return null;
  const variety = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((re) => re.test(pw)).length;
  if (pw.length >= 12 && variety >= 3) return 'strong';
  if (pw.length >= 6 && variety >= 2) return 'okay';
  return 'weak';
}

function registerScreen(card: HTMLElement): void {
  card.appendChild(head(s('registerHeading'), s('registerSub')));
  const form = el('form');
  form.noValidate = true;
  const submit = primary(s('register'), s('register'));
  const meter = el('div', 'strength');
  const bars = el('div', 'bars');
  bars.append(el('i'), el('i'), el('i'));
  const meterLabel = el('span');
  meter.append(bars, meterLabel);
  const userBad = (): boolean => st.username.length > 0 && !USERNAME_RE.test(st.username);
  const pwError = (): string | null => {
    if (st.regPassword.length > 0 && st.regPassword.length < PASSWORD_MIN) return 'passwordMin';
    if (st.regPassword.length > 0 && !PASSWORD_RE.test(st.regPassword)) return 'passwordPattern';
    return null;
  };
  const user = field({ label: s('usernameLabel'), name: 'username', type: 'text', icon: 'user', value: st.username, autocomplete: 'username', clean: (v) => v.trim(), onInput: (v) => { st.username = v; sync(); } });
  const email = field({ label: s('emailLabel'), name: 'regEmail', type: 'email', icon: 'mail', value: st.regEmail, placeholder: s('emailPlaceholder'), autocomplete: 'email', onInput: (v) => { st.regEmail = v; sync(); } });
  const pw = field({ label: s('passwordLabel'), name: 'regPassword', type: 'password', icon: 'lock', value: st.regPassword, autocomplete: 'new-password', onInput: (v) => { st.regPassword = v; sync(); } });
  pw.input.maxLength = 1024; // longer than 128 must be typed to be told (passwordPattern), as on the web
  const sync = (): void => {
    user.setError(userBad() ? s('usernamePattern') : null);
    const pe = pwError();
    pw.setError(pe ? s(pe) : null);
    const strength = strengthOf(st.regPassword);
    meter.hidden = strength === null;
    meter.className = strength ? `strength ${strength}` : 'strength';
    meterLabel.textContent = strength ? s(strength) : '';
    submit.disabled = st.busy || userBad() || pe !== null || st.username === '' || st.regEmail === '' || st.regPassword === '';
  };
  const pwWrap = el('div', 'field');
  pwWrap.append(pw.root, meter);
  form.append(user.root, email.root, pwWrap);
  noticeBox = notice();
  form.append(noticeBox, submit);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (submit.disabled) return;
    void run(() => bridge.register(st.username, st.regEmail, st.regPassword), () => {
      st.verifyEmail = st.regEmail;
      st.code = blankCode();
      st.view = 'verify';
      startCooldown();
    });
  });
  sync();
  card.appendChild(form);
  const sw = el('p', 'switch', `${s('hasAccount')} `);
  sw.appendChild(link(s('loginLink'), () => go('login')));
  card.appendChild(sw);
  if (!st.focus) st.focus = 'username';
}

function startCooldown(): void {
  st.resendLeft = RESEND_COOLDOWN_S;
  window.clearInterval(resendTimer);
  resendTimer = window.setInterval(() => {
    st.resendLeft = Math.max(0, st.resendLeft - 1);
    if (st.resendLeft === 0) window.clearInterval(resendTimer);
    paintResend?.();
  }, 1000);
}
let paintResend: (() => void) | null = null;

function verifyScreen(card: HTMLElement): void {
  card.classList.add('center');
  const top = el('div', 'col');
  top.appendChild(medal('mailCheck'));
  const h = el('header', 'head center');
  h.appendChild(el('h1', undefined, s('emailVerifyTitle')));
  const sub = el('p', 'sub', s('emailVerifyText'));
  sub.appendChild(el('br'));
  sub.appendChild(el('span', 'who-mail', st.verifyEmail));
  h.appendChild(sub);
  top.appendChild(h);
  card.appendChild(top);

  const boxes: HTMLInputElement[] = [];
  const row = el('div', 'otp');
  const submitCode = (code: string): void => {
    void run(() => bridge.confirm(st.verifyEmail, code), () => {});
  };
  st.code.forEach((digit, i) => {
    const b = el('input');
    b.type = 'text';
    b.name = `code${i}`;
    b.inputMode = 'numeric';
    b.maxLength = CODE_LENGTH;
    b.setAttribute('autocomplete', i === 0 ? 'one-time-code' : 'off');
    b.setAttribute('aria-label', s('emailVerifyDigit', { n: i + 1 }));
    if (st.error) b.setAttribute('aria-invalid', 'true');
    b.value = digit;
    b.disabled = st.busy;
    b.addEventListener('input', () => {
      const value = b.value;
      if (!/^\d*$/.test(value)) {
        b.value = st.code[i] ?? '';
        return;
      }
      const next = [...st.code];
      if (value.length > 1) {
        // a pasted (or auto-filled) code is spread over the six boxes
        const chars = value.slice(0, CODE_LENGTH).split('');
        for (let k = 0; k < CODE_LENGTH; k++) next[k] = chars[k] ?? '';
        st.code = next;
        boxes.forEach((x, k) => { x.value = next[k] ?? ''; });
        boxes[Math.min(chars.length, CODE_LENGTH - 1)]?.focus();
        if (chars.length === CODE_LENGTH) submitCode(next.join(''));
        return;
      }
      next[i] = value;
      st.code = next;
      clearError();
      if (value && i < CODE_LENGTH - 1) boxes[i + 1]?.focus();
      if (next.every((d) => d !== '')) submitCode(next.join(''));
    });
    b.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !st.code[i] && i > 0) boxes[i - 1]?.focus();
    });
    boxes.push(b);
    row.appendChild(b);
  });
  card.appendChild(row);

  const col = el('div', 'col');
  const status = el('p', 'status');
  status.setAttribute('aria-live', 'polite');
  if (st.busy) {
    status.appendChild(icon('loader', 'spin'));
    status.appendChild(el('span', undefined, s('emailVerifyChecking')));
  }
  col.appendChild(status);
  noticeBox = notice();
  col.appendChild(noticeBox);
  const resend = link('', () => {
    if (st.resendLeft > 0 || st.resending) return;
    st.resending = true;
    paintResend?.();
    void bridge.register(st.username, st.verifyEmail, st.regPassword).then(
      (r) => {
        st.resending = false;
        if (r.ok) {
          st.error = null;
          startCooldown();
          if (noticeBox) noticeBox.hidden = true;
        } else {
          st.error = r.kind === 'message' ? r : { ok: false, kind: 'errResend' };
        }
        render();
      },
      () => {
        st.resending = false;
        st.error = { ok: false, kind: 'errResend' };
        render();
      },
    );
  });
  paintResend = (): void => {
    resend.disabled = st.resending || st.resendLeft > 0;
    resend.textContent = st.resendLeft > 0 ? `${s('resendCooldown')} (${st.resendLeft}s)` : s('resend');
  };
  paintResend();
  col.appendChild(resend);
  const back = link(s('goToLogin'), () => go('login'));
  back.classList.add('back');
  back.prepend(icon('arrowLeft'));
  col.appendChild(back);
  card.appendChild(col);
  if (!st.focus) st.focus = `code${Math.max(0, st.code.findIndex((d) => d === ''))}`;
  // A wrong code empties the boxes and puts the cursor back in the first one (as on the web); run() redraws with the error.
  if (st.error && !st.busy && st.code.some((d) => d !== '')) {
    st.code = blankCode();
    boxes.forEach((x) => { x.value = ''; });
    st.focus = 'code0';
  }
}

function forgotScreen(card: HTMLElement): void {
  card.appendChild(head(s('forgotHeading'), s('forgotSubtitle')));
  const form = el('form');
  form.noValidate = true;
  const submit = primary(s('forgotSubmit'), s('forgotSending'));
  const sync = (): void => {
    submit.disabled = st.busy || st.forgotEmail === '';
  };
  const email = field({ label: s('emailLabel'), name: 'forgotEmail', type: 'email', icon: 'mail', value: st.forgotEmail, placeholder: s('emailPlaceholder'), autocomplete: 'email', onInput: (v) => { st.forgotEmail = v; sync(); } });
  form.appendChild(email.root);
  noticeBox = notice();
  form.append(noticeBox, submit);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (submit.disabled) return;
    const to = st.forgotEmail;
    void run(() => bridge.forgot(to), () => {
      st.sentTo = to;
      st.view = 'forgotSent';
    });
  });
  sync();
  card.appendChild(form);
  const back = el('p', 'switch');
  const b = link(s('forgotBackToLogin'), () => go('login'));
  b.classList.add('back');
  b.prepend(icon('arrowLeft'));
  back.appendChild(b);
  card.appendChild(back);
  if (!st.focus) st.focus = 'forgotEmail';
}

function resultScreen(card: HTMLElement, icn: string, tone: string, title: string, hint: string, action: string, onAction: () => void): void {
  card.classList.add('center');
  const col = el('div', 'col');
  col.appendChild(medal(icn, tone));
  col.appendChild(head(title, hint, true));
  card.appendChild(col);
  const b = button('btn primary', action, onAction);
  card.appendChild(b);
}

function resetScreen(card: HTMLElement): void {
  card.appendChild(head(s('resetHeading'), s('resetSubtitle')));
  const form = el('form');
  form.noValidate = true;
  const submit = primary(s('resetSubmit'), s('resetSaving'));
  const pw = field({ label: s('resetNewPasswordLabel'), name: 'newPassword', type: 'password', icon: 'lock', value: st.newPw, autocomplete: 'new-password', hint: s('passwordMin'), onInput: (v) => { st.newPw = v; sync(); } });
  const again = field({ label: s('resetRepeatLabel'), name: 'confirmPassword', type: 'password', icon: 'lock', value: st.confirmPw, autocomplete: 'new-password', onInput: (v) => { st.confirmPw = v; sync(); } });
  pw.input.maxLength = 128;
  again.input.maxLength = 128;
  const sync = (): void => {
    const tooShort = st.newPw.length > 0 && st.newPw.length < PASSWORD_MIN;
    const mismatch = st.confirmPw.length > 0 && st.newPw !== st.confirmPw;
    pw.setError(tooShort ? s('passwordMin') : null);
    again.setError(mismatch ? s('passwordMismatch') : null);
    submit.disabled = st.busy || tooShort || mismatch || st.newPw === '' || st.confirmPw === '';
  };
  form.append(pw.root, again.root);
  noticeBox = notice();
  form.append(noticeBox, submit);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (submit.disabled) return;
    void run(() => bridge.reset(st.newPw, st.confirmPw), () => {
      st.newPw = '';
      st.confirmPw = '';
      st.view = 'resetDone';
    });
  });
  sync();
  card.appendChild(form);
  if (!st.focus) st.focus = 'newPassword';
}

function googleScreen(card: HTMLElement): void {
  card.classList.add('center');
  const col = el('div', 'col');
  const w = el('span', 'wait');
  w.setAttribute('aria-hidden', 'true');
  w.appendChild(el('i'));
  col.appendChild(w);
  col.setAttribute('aria-live', 'polite');
  col.setAttribute('aria-busy', 'true');
  col.appendChild(head(s('loggingIn'), s('loggingInSub'), true));
  card.appendChild(col);
  const back = el('p', 'switch');
  const b = link(s('forgotBackToLogin'), () => {
    void bridge.cancelGoogle();
    go('login');
  });
  b.classList.add('back');
  b.prepend(icon('arrowLeft'));
  back.appendChild(b);
  card.appendChild(back);
}

async function startGoogle(): Promise<void> {
  if (st.busy) return;
  st.error = null;
  go('google');
  let r: GoogleResult;
  try {
    r = await bridge.google();
  } catch {
    r = { kind: 'error' };
  }
  if (r.kind === 'ok' || st.view !== 'google') return; // signed in (the main process moved on), or the user went back
  st.view = 'login';
  st.error = r.kind === 'blocked' ? { ok: false, kind: 'blocked', reason: r.reason || null } : r.kind === 'error' ? { ok: false, kind: 'genericError' } : null;
  render();
}

// ---------------------------------------------------------------- page

function render(): void {
  if (!st.S) return;
  document.documentElement.lang = st.S.lang;
  noticeBox = null;
  paintResend = null;
  const wrap = el('div', 'wrap');

  const brand = el('div', 'brand');
  brand.appendChild(shapes('0 0 112 90', LOGO, '36', '29'));
  brand.appendChild(el('span', undefined, 'WeWatch'));
  wrap.appendChild(brand);

  const card = el('section', 'card');
  card.dataset['screen'] = st.view;
  switch (st.view) {
    case 'login': loginScreen(card); break;
    case 'register': registerScreen(card); break;
    case 'verify': verifyScreen(card); break;
    case 'forgot': forgotScreen(card); break;
    case 'forgotSent':
      resultScreen(card, 'mailCheck', 'ok', s('forgotSent'), s('forgotSentHint', { email: st.sentTo }), s('forgotBackToLogin'), () => go('login'));
      break;
    case 'reset': resetScreen(card); break;
    case 'resetInvalid':
      resultScreen(card, 'shieldX', 'bad', s('resetLinkInvalid'), s('resetLinkInvalidHint'), s('forgotSubmit'), () => go('forgot'));
      break;
    case 'resetDone':
      resultScreen(card, 'checkCircle', 'ok', s('resetSuccess'), s('resetSuccessHint'), s('forgotBackToLogin'), () => go('login'));
      break;
    case 'google': googleScreen(card); break;
  }
  wrap.appendChild(card);

  const foot = el('p', 'foot');
  foot.appendChild(button('', s('help'), () => void bridge.help()));
  const dot = el('span', 'dot', '·');
  dot.setAttribute('aria-hidden', 'true');
  foot.appendChild(dot);
  foot.appendChild(button('', s('backToSite'), () => void bridge.about()));
  wrap.appendChild(foot);

  root.replaceChildren(wrap);
  const f = st.focus ? root.querySelector<HTMLInputElement>(`input[name="${st.focus}"]`) : null;
  st.focus = '';
  if (f && !f.disabled && document.hasFocus()) f.focus();
}

function resetAll(): void {
  window.clearInterval(resendTimer);
  Object.assign(st, {
    email: '', password: '', username: '', regEmail: '', regPassword: '', verifyEmail: '', code: blankCode(), forgotEmail: '', sentTo: '',
    newPw: '', confirmPw: '', busy: false, error: null, resendLeft: 0, resending: false, focus: '',
  });
}

bridge.onData((d) => {
  st.S = d.strings;
  if (d.fresh) {
    resetAll();
    st.view = d.googleWaiting ? 'google' : d.screen === 'reset' ? (d.hasToken ? 'reset' : 'resetInvalid') : d.screen;
  }
  render();
});
void bridge.ready();
})();
