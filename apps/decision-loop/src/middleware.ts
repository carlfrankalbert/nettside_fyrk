import { defineMiddleware } from 'astro:middleware';
import { createServerClient } from './lib/supabase';

const PUBLIC_PATHS = ['/login', '/api/auth/callback'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/share/')
  ) {
    return next();
  }

  const supabase = createServerClient(context.cookies);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return context.redirect('/login');
  }

  (context.locals as unknown as Record<string, unknown>).user = user;
  (context.locals as unknown as Record<string, unknown>).supabase = supabase;

  return next();
});
