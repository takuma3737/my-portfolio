import { defineMiddleware } from 'astro/middleware';
import {
  generateUid,
  setUserSession,
  verifyCookieValue,
  needsRenew,
} from './utils/session';

export const onRequest = defineMiddleware(async (context, next) => {
  try {
    const raw = context.cookies.get('user-session')?.value;
    const parsed = verifyCookieValue(raw);
    const now = Math.floor(Date.now() / 1000);

    if (!parsed) {
      const uid = generateUid();
      setUserSession(context.cookies, { uid, issuedAt: now });
    } else if (needsRenew(parsed.issuedAt, now)) {
      setUserSession(context.cookies, { uid: parsed.uid, issuedAt: now });
    }
  } catch {
    // フェイルセーフ: 例外時はCookieを触らず、処理を続行
  }

  return next();
});

