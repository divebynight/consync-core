import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		commonjsOptions: {
			include: [/src/, /node_modules/],
		},
	},
});