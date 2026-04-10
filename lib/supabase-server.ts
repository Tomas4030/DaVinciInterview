import "server-only";

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

/** Usar em Server Components / Route Handlers / layouts server-side */
export const createServerClient = () =>
  createServerComponentClient<Database>(
    { cookies },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
  );

// Alias em português
export const criarClienteSupabase = createServerClient;
