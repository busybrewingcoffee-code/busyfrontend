import { createClient } from "@supabase/supabase-js";
const env = import.meta.env;
// Bound network waits so checkout can recover using its durable request ID.
const timedFetch: typeof fetch = async (input, init) => {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (init?.signal?.aborted) abort();
  init?.signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, 15000);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
    init?.signal?.removeEventListener("abort", abort);
  }
};
export const supabase =
  env.VITE_SUPABASE_URL && env.VITE_SUPABASE_PUBLISHABLE_KEY
    ? createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, {
        global: { fetch: timedFetch },
      })
    : null;
