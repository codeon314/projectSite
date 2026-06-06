import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'static',
  build: {
    // Forces Astro to generate about.html instead of about/index.html.
    // This completely fixes the Cloudflare Worker 404 routing bug!
    format: 'file'
  },
  adapter: cloudflare({
    platformProxy: {
      enabled: true
    }
  })
});