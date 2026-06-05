import { getValidatedIpFromHeader } from "@astrojs/internal-helpers/request";
function matchStaticAsset(manifest, requestUrl, env) {
  const { pathname } = new URL(requestUrl);
  if (manifest.assets.has(pathname)) {
    return env.ASSETS.fetch(requestUrl.replace(/\.html$/, ""));
  }
  return void 0;
}
async function fallbackToAssets(requestUrl, env) {
  const asset = await env.ASSETS.fetch(
    requestUrl.replace(/index.html$/, "").replace(/\.html$/, "")
  );
  if (asset.status !== 404) {
    return asset;
  }
  return void 0;
}
function createErrorPageFetch(env) {
  return async (url) => {
    return env.ASSETS.fetch(url.replace(/\.html$/, ""));
  };
}
function createLocals(ctx) {
  const locals = {
    cfContext: ctx
  };
  Object.defineProperty(locals, "runtime", {
    enumerable: false,
    value: {
      get env() {
        throw new Error(
          `Astro.locals.runtime.env has been removed in Astro v6. Use 'import { env } from "cloudflare:workers"' instead.`
        );
      },
      get cf() {
        throw new Error(
          `Astro.locals.runtime.cf has been removed in Astro v6. Use 'Astro.request.cf' instead.`
        );
      },
      get caches() {
        throw new Error(
          `Astro.locals.runtime.caches has been removed in Astro v6. Use the global 'caches' object instead.`
        );
      },
      get ctx() {
        throw new Error(
          `Astro.locals.runtime.ctx has been removed in Astro v6. Use 'Astro.locals.cfContext' instead.`
        );
      }
    }
  });
  return locals;
}
function getClientAddress(request) {
  return getValidatedIpFromHeader(request.headers.get("cf-connecting-ip"));
}
export {
  createErrorPageFetch,
  createLocals,
  fallbackToAssets,
  getClientAddress,
  matchStaticAsset
};
