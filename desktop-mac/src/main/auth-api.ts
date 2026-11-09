// Network side of the native sign-in screens. The MAIN process sends every request, through the app's own session
// (session.defaultSession, the same cookie jar the web view and the native Home use), to the web app's BFF routes — so a
// successful login / e-mail confirmation leaves exactly the httpOnly access_token / refresh_token cookies a web sign-in
// would. The renderer only hands over plain values; URLs and bodies are built here (auth-model.ts). Passwords and tokens
// are never logged.
import { APP_URL } from './config';
import { call } from './home-data';
import {
  authApiUrls, classifyConfirm, classifyForgot, classifyLogin, classifyRegister, classifyReset, confirmBody, forgotBody, loginBody, registerBody, resetBody,
  type Answer, type AuthOutcome,
} from './auth-model';

const INVALID: AuthOutcome = { ok: false, kind: 'invalid' };

/** One POST without the refresh-and-retry of the signed-in calls: nobody is signed in here. */
async function post(url: string, body: object): Promise<Answer> {
  try {
    const res = await call(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    return { status: res.status, body: await res.json().catch(() => null) };
  } catch {
    return { status: 0, body: null }; // offline, DNS, timeout
  }
}

const urls = (): ReturnType<typeof authApiUrls> => authApiUrls(APP_URL);

export async function login(email: unknown, password: unknown): Promise<AuthOutcome> {
  const b = loginBody(email, password);
  return b ? classifyLogin(await post(urls().login, b)) : INVALID;
}

/** Also the "resend code" button: the web BFF has no resend route, and repeating the registration sends a fresh code. */
export async function register(username: unknown, email: unknown, password: unknown): Promise<AuthOutcome> {
  const b = registerBody(username, email, password);
  return b ? classifyRegister(await post(urls().register, b)) : INVALID;
}

export async function confirmEmail(email: unknown, code: unknown): Promise<AuthOutcome> {
  const b = confirmBody(email, code);
  return b ? classifyConfirm(await post(urls().confirm, b)) : INVALID;
}

export async function forgotPassword(email: unknown): Promise<AuthOutcome> {
  const b = forgotBody(email);
  return b ? classifyForgot(await post(urls().forgot, b)) : INVALID;
}

export async function resetPassword(token: string | null, password: unknown, confirm: unknown): Promise<AuthOutcome> {
  const b = resetBody(token, password, confirm);
  return b ? classifyReset(await post(urls().reset, b)) : INVALID;
}
