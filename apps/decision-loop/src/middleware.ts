import { defineMiddleware } from 'astro:middleware';
import { createServerClient, createServiceRoleClient } from './lib/supabase';

const PUBLIC_PATHS = ['/login', '/api/auth/callback'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/share/')
  ) {
    return next();
  }

  const runtime = (context.locals as Record<string, unknown>).runtime as { env?: Record<string, string> } | undefined;

  // Dev bypass: skip auth and use service role client with a fixed user
  if (import.meta.env.DEV) {
    const supabase = createServiceRoleClient(runtime);
    const fakeUser = {
      id: 'f06767f1-da8a-4070-ab46-c93328026182',
      email: 'dev@localhost',
    };
    (context.locals as unknown as Record<string, unknown>).user = fakeUser;
    (context.locals as unknown as Record<string, unknown>).supabase = supabase;
    return next();
  }

  try {
    const supabase = createServerClient(context.cookies, runtime);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return context.redirect('/login');
    }

    (context.locals as unknown as Record<string, unknown>).user = user;
    (context.locals as unknown as Record<string, unknown>).supabase = supabase;

    return next();
  } catch {
    return context.redirect('/login');
  }
});
