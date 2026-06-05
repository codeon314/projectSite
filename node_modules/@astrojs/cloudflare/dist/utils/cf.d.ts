import type { ManifestLike } from './cf-helpers.js';
export type { Runtime, ManifestLike } from './cf-helpers.js';
export { matchStaticAsset, fallbackToAssets, createErrorPageFetch, createLocals, getClientAddress, } from './cf-helpers.js';
/**
 * Injects the SESSION KV binding into the app manifest's session config.
 * Idempotent — safe to call on every request.
 */
export declare function injectSessionBinding(manifest: ManifestLike, env: Env): void;
