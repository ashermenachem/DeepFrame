/* oxlint-disable typescript/no-redundant-type-constituents, typescript/no-deprecated -- @supabase/ssr defaults ungenerated database types to any and auto-manages browser cookies. */
import { createBrowserClient } from '@supabase/ssr';

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  browserClient ??= createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
  return browserClient;
}
