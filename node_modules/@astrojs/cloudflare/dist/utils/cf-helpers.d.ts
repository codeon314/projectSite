export interface Runtime {
    cfContext: ExecutionContext;
}
/** Minimal manifest shape needed by the Cloudflare helpers. */
export interface ManifestLike {
    assets: Set<string>;
    sessionConfig?: {
        options?: Record<string, unknown>;
    } | undefined;
}
/**
 * Returns a `Response` from the ASSETS binding if the request pathname
 * is a known static asset. Returns `undefined` otherwise.
 */
export declare function matchStaticAsset(manifest: ManifestLike, requestUrl: string, env: Env): Response | undefined;
/**
 * Tries the ASSETS binding as a fallback for an unmatched route.
 * Returns the asset `Response` if found (non-404), `undefined` otherwise.
 */
export declare function fallbackToAssets(requestUrl: string, env: Env): Promise<Response | undefined>;
/**
 * Creates a fetch function for prerendered error pages via the ASSETS binding.
 */
export declare function createErrorPageFetch(env: Env): (url: string) => Promise<Response>;
/**
 * Creates the Cloudflare-specific locals object with `cfContext`
 * and deprecated `runtime` property getters.
 */
export declare function createLocals(ctx: ExecutionContext): Runtime;
/**
 * Extracts the client IP address from the `cf-connecting-ip` header.
 */
export declare function getClientAddress(request: Request): string | undefined;
