import type { FetchState } from 'astro/fetch';
/**
 * Applies Cloudflare-specific setup to a `FetchState`:
 * - Injects the SESSION KV binding
 * - Serves static assets via the ASSETS binding
 * - Sets `locals.cfContext`, client address, `waitUntil`, and error page fetch
 *
 * Returns a `Response` if the request was handled by the ASSETS binding
 * (static file hit). Returns `undefined` when the caller should continue
 * to Astro rendering.
 */
export declare function cf(state: FetchState, env: Env, ctx: ExecutionContext): Promise<Response | undefined>;
