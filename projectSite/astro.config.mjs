import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// In Astro v6, 'hybrid' was removed. 'static' is the default and 
// automatically supports serverless endpoints when an adapter is present
// and the endpoint exports `prerender = false`.
export default defineConfig({
  output: 'static',
  adapter: cloudflare({
    platformProxy: {
      enabled: true
    }
  })
});