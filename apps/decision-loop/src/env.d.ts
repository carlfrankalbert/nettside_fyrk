/// <reference types="astro/client" />

import type { SupabaseClient, User } from '@supabase/supabase-js';

declare namespace App {
  interface Locals {
    user: User;
    supabase: SupabaseClient;
  }
}
