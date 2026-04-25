import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	build: {
		outDir: '.vite/build',
		lib: {
			entry: path.resolve('src/electron/preload/preload.js'),
			formats: ['cjs'],
			fileName: () => 'preload.js',
		},
		rollupOptions: {
			external: ['electron'],
		},
		commonjsOptions: {
			include: [/src/, /node_modules/],
		},
	},
});