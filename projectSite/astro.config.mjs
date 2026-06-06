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
        // Explicitly exclude all static page routes from the Worker.
        // This forces Cloudflare Pages to serve them via its native static asset server,
        // which correctly handles extensionless URLs and auto-index resolution (preventing 404s).
        exclude: [
          '/about',
          '/about/',
          '/blog',
          '/blog/*',
          '/projects',
          '/projects/*'
        ]
      }
    }
  })
});