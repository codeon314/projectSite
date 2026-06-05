import { FetchState } from "astro/fetch";
import { cf as cfFetch } from "./fetch.js";
const FETCH_STATE_KEY = "fetchState";
function getFetchState(context) {
  const state = context.get?.(FETCH_STATE_KEY);
  if (state) return state;
  const nextState = new FetchState(context.req.raw);
  context.set?.(FETCH_STATE_KEY, nextState);
  return nextState;
}
function cf() {
  return async (context, next) => {
    const state = getFetchState(context);
    const asset = await cfFetch(state, context.env, context.executionCtx);
    if (asset) return asset;
    await next();
  };
}
export {
  cf
};
