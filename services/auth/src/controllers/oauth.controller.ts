import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { apiResponse } from '@shared/utils/apiResponse';
import { logger } from '@shared/utils/logger';

export class OAuthController {
  constructor(private authService: AuthService) {}

  // POST /auth/google/init — mobile: generate state UUID for polling flow
  googleMobileInit = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const state = await this.authService.initMobileGoogleAuth();
      res.json(apiResponse.success({ state }, 'Google mobile auth initiated'));
    } catch (error) {
      next(error);
    }
  };

  // GET /auth/google/mobile?state=UUID — redirect to Google OAuth (mobile flow)
  googleMobileRedirect = async (req: Request, res: Response): Promise<void> => {
    const state = req.query.state as string;
    const isValid = state ? await this.authService.isMobileGoogleState(state) : false;
    if (!isValid) {
      res.status(400).send('<html><body>Invalid or expired state. Please try again.</body></html>');
      return;
    }
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? '',
      redirect_uri: process.env.GOOGLE_CALLBACK_URL ?? '',
      response_type: 'code',
      scope: 'openid profile email',
      state: `m:${state}`,
      access_type: 'offline',
      prompt: 'select_account',
    });
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  };

  // GET /auth/google/callback — mobile branch (state starts with "m:")
  googleMobileCallback = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { code, state } = req.query as { code?: string; state?: string };
    const mobileState = (state ?? '').replace('m:', '');

    const successHtml = `<!DOCTYPE html><html><head>
      <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <title>CineSync</title>
      <script>window.location.href='cinesync://auth/callback';</script>
      <style>*{box-sizing:border-box;margin:0;padding:0}
        body{display:flex;flex-direction:column;align-items:center;justify-content:center;
             min-height:100vh;background:#0A0A0F;color:#fff;font-family:-apple-system,sans-serif;
             text-align:center;padding:32px}
        h2{font-size:22px;font-weight:700;color:#7B72F8;margin:16px 0 8px}
        p{color:#888;font-size:15px;margin-bottom:24px}
        a{display:block;background:#7B72F8;color:#fff;text-decoration:none;
          font-size:17px;font-weight:700;padding:16px 32px;border-radius:16px}</style>
      </head><body>
      <div style="font-size:64px">✅</div>
      <h2>Вы вошли в CineSync!</h2>
      <p>Возвращаемся в приложение...</p>
      <a href="cinesync://auth/callback">🎬 Открыть CineSync</a>
    </body></html>`;
    const errorHtml = `<html><body style="background:#0A0A0F;color:#fff;font-family:sans-serif;text-align:center;padding:60px">
      <h2>❌ Ошибка входа</h2><p>Попробуйте снова в приложении.</p></body></html>`;

    if (!code) { res.send(errorHtml); return; }
    try {
      const idToken = await this.authService.exchangeCodeForIdToken(code);
      const profile = await this.authService.verifyGoogleIdToken(idToken);
      const user = await this.authService.findOrCreateGoogleUser(profile);
      const { accessToken, refreshToken } = await this.authService.generateAndStoreTokens(
        user._id.toString(), user.email,
        user.role as import('@shared/types').UserRole,
        req.ip ?? null, req.headers['user-agent'] ?? null,
      );
      await this.authService.storeMobileGoogleResult(mobileState, {
        user: user.toJSON(),
        accessToken,
        refreshToken,
      });
      res.send(successHtml);
    } catch (err) {
      const error = err as { code?: string; reason?: string; userId?: string };
      if (error.code === 'ACCOUNT_BLOCKED') {
        await this.authService.storeMobileGoogleResult(mobileState, {
          error: 'ACCOUNT_BLOCKED',
          reason: error.reason ?? 'Your account has been suspended',
          userId: error.userId ?? '',
        }).catch((storeErr: unknown) => { logger.warn('Failed to store mobile Google result', { storeErr }); });
        res.send(successHtml);
      } else {
        res.send(errorHtml);
      }
    }
  };

  // GET /auth/google/poll?state=UUID — mobile: poll for tokens
  googleMobilePoll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { state } = req.query as { state: string };
      if (!state) { res.status(400).json(apiResponse.error('state is required')); return; }
      const result = await this.authService.pollMobileGoogleResult(state);
      if (!result) { res.status(202).json(apiResponse.success(null, 'Pending')); return; }
      res.json(apiResponse.success(result, 'Google login successful'));
    } catch (error) {
      next(error);
    }
  };

  googleCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as import('../types/index').GoogleOAuthProfile;
      const found = await this.authService.findOrCreateGoogleUser(user);
      const { accessToken, refreshToken } = await this.authService.generateAndStoreTokens(
        found._id.toString(),
        found.email,
        found.role as import('@shared/types').UserRole,
        req.ip ?? null,
        req.headers['user-agent'] ?? null,
      );
      const code = await this.authService.createOAuthTempCode(accessToken, refreshToken);
      res.redirect(`${process.env.CLIENT_URL}/auth/callback?code=${code}`);
    } catch (error) {
      next(error);
    }
  };

  googleNativeToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { idToken } = req.body as { idToken: string };
      const profile = await this.authService.verifyGoogleIdToken(idToken);
      const user = await this.authService.findOrCreateGoogleUser(profile);
      const { accessToken, refreshToken } = await this.authService.generateAndStoreTokens(
        user._id.toString(),
        user.email,
        user.role as import('@shared/types').UserRole,
        req.ip ?? null,
        req.headers['user-agent'] ?? null,
      );
      res.json(apiResponse.success({ user, accessToken, refreshToken }, 'Google login successful'));
    } catch (error) {
      const err = error as { code?: string; reason?: string; userId?: string };
      if (err.code === 'ACCOUNT_BLOCKED') {
        res.status(403).json({
          success: false, code: 'ACCOUNT_BLOCKED',
          message: 'Account is blocked',
          reason: err.reason ?? 'No reason provided',
          userId: err.userId ?? null,
          data: null, errors: null,
        });
        return;
      }
      next(error);
    }
  };

  googleExchange = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code } = req.body as { code: string };
      if (!code) { res.status(400).json(apiResponse.error('code is required')); return; }
      const tokens = await this.authService.exchangeOAuthCode(code);
      res.json(apiResponse.success(tokens, 'Tokens exchanged'));
    } catch (error) {
      next(error);
    }
  };

  // ─── TELEGRAM AUTH ─────────────────────────────────────────────────────────

  telegramLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = req.body as {
        id: string; first_name: string; last_name?: string;
        username?: string; photo_url?: string; auth_date: string; hash: string;
      };
      const result = await this.authService.loginWithTelegramData(data);
      res.json(apiResponse.success(result, 'Telegram login successful'));
    } catch (error) {
      next(error);
    }
  };

  telegramInit = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.initTelegramAuth();
      res.json(apiResponse.success(result, 'Telegram auth initiated'));
    } catch (error) {
      next(error);
    }
  };

  telegramWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
      const receivedSecret = req.headers['x-telegram-bot-api-secret-token'];
      if (!expectedSecret || receivedSecret !== expectedSecret) {
        res.status(403).json(apiResponse.error('Forbidden'));
        return;
      }
      await this.authService.handleTelegramWebhook(req.body as Parameters<typeof this.authService.handleTelegramWebhook>[0]);
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  };

  telegramRedirect = (_req: Request, res: Response): void => {
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>CineSync</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{display:flex;flex-direction:column;align-items:center;justify-content:center;
         min-height:100vh;background:#0A0A0F;color:#fff;font-family:-apple-system,sans-serif;
         text-align:center;padding:32px}
    .check{font-size:64px;margin-bottom:16px}
    h2{font-size:22px;font-weight:700;color:#7B72F8;margin-bottom:8px}
    p{color:#888;font-size:15px;line-height:1.5;margin-bottom:24px}
    a.btn{display:block;background:#7B72F8;color:#fff;text-decoration:none;
          font-size:17px;font-weight:700;padding:16px 32px;border-radius:16px;
          margin-bottom:16px;letter-spacing:0.3px}
    .hint{color:#555;font-size:13px}
  </style>
</head>
<body>
  <div class="check">✅</div>
  <h2>Вы вошли в CineSync!</h2>
  <p>Нажмите кнопку ниже чтобы вернуться в приложение</p>
  <a class="btn" href="cinesync://auth/callback">🎬 Открыть CineSync</a>
  <p class="hint">Или просто нажмите «Назад» в браузере</p>
</body>
</html>`);
  };

  telegramPoll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { state } = req.query as { state: string };
      if (!state) { res.status(400).json(apiResponse.error('state is required')); return; }
      const result = await this.authService.pollTelegramAuth(state);
      if (!result) { res.status(202).json(apiResponse.success(null, 'Pending')); return; }
      res.json(apiResponse.success(result, 'Telegram login successful'));
    } catch (error) {
      next(error);
    }
  };
}
