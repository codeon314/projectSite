import { defineConfig } from 'astro/config';

import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: "standalone"
  }),
    // This server block configures BOTH the dev server AND the final production server
  server: {
    host: true, // This is the key! It means "listen on all network interfaces"
    port: 4321, // You can explicitly set the port here
  },
  // Your vite config for playit.gg might still be needed
  vite: {
    preview: {
      host: true,
      allowedHosts: ['projhosting.playit.plus'],
    },
  },
});