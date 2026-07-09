/**
 * Server-side helper for the Next route handlers that proxy to the ticketing API.
 *
 * Two things this fixes:
 *  1. **Never hairpin through the public URL.** These calls run on the same box
 *     as the API, so going out to `https://api-ticketing.gocodeable.com` sends
 *     them through Cloudflare and back — adding latency and, worse, Cloudflare's
 *     ~100s request cap. `TICKETING_API_INTERNAL_URL` (a runtime var, NOT
 *     NEXT_PUBLIC_, so it can change without a rebuild) points straight at the
 *     backend. Falls back to the public URL if unset.
 *  2. **Never blindly JSON.parse the response.** A gateway timeout or 502 returns
 *     an HTML error page; `res.json()` on that throws `Unexpected token '<'`,
 *     which tells nobody anything. `readJson` surfaces the real status instead.
 */

export const backendUrl = (path: string): string => {
  const base =
    process.env.TICKETING_API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:3000";
  return `${base.replace(/\/+$/, "")}${path}`;
};

export interface BackendResult<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  /** Human-readable failure reason, set whenever ok === false. */
  error?: string;
}

/** Fetch the backend and parse JSON defensively. Never throws on a bad body. */
export async function readJson<T = any>(
  path: string,
  init: RequestInit
): Promise<BackendResult<T>> {
  let res: Response;
  try {
    res = await fetch(backendUrl(path), init);
  } catch (err: any) {
    return {
      ok: false,
      status: 502,
      data: null,
      error: `Could not reach the ticketing API: ${err?.message || "network error"}`,
    };
  }

  const text = await res.text();
  let body: any = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      // An HTML error page (gateway timeout / 502 / Cloudflare) — say so plainly.
      return {
        ok: false,
        status: res.status,
        data: null,
        error:
          res.status === 504 || res.status === 524
            ? "The ticketing API timed out."
            : `The ticketing API returned a non-JSON ${res.status} response.`,
      };
    }
  }

  if (!res.ok || (body && body.success === false)) {
    return {
      ok: false,
      status: res.status,
      data: null,
      error: body?.message || `Request failed (${res.status})`,
    };
  }

  return { ok: true, status: res.status, data: (body?.data ?? body) as T };
}
