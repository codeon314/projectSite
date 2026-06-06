import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'static',
  adapter: cloudflare({
    platformProxy: {
      enabled: true
    },
    routes: {
      extend: {
        // THE BULLETPROOF FIX:
        // Force Cloudflare to ONLY send /api/ requests to the Worker.
        // Everything else (/*) bypasses the Worker and is served natively as static HTML.
        // This completely eliminates the 404 routing bug!
        include: ['/api/*'],
        exclude: ['/*']
      }
    }
  })
});