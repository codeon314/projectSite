import { defineConfig } from 'vite';

	export default defineConfig({
			  // ... other configurations
					preview: {
								allowedHosts: ['projhosting.playit.plus'], ['16.ip.na.ply.gg']
					},
					dev: 
					{
						allowedHosts: ['projhosting.playit.plus'], ['16.ip.na.ply.gg']
					}
	// ... other configurations
	});