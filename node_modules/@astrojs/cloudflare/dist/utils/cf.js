import { sessionKVBindingName } from "virtual:astro-cloudflare:config";
import {
  matchStaticAsset,
  fallbackToAssets,
  createErrorPageFetch,
  createLocals,
  getClientAddress
} from "./cf-helpers.js";
function injectSessionBinding(manifest, env) {
  if (env[sessionKVBindingName]) {
    const sessionConfigOptions = manifest.sessionConfig?.options ?? {};
    Object.assign(sessionConfigOptions, {
      binding: env[sessionKVBindingName]
    });
  }
}
export {
  createErrorPageFetch,
  createLocals,
  fallbackToAssets,
  getClientAddress,
  injectSessionBinding,
  matchStaticAsset
};
