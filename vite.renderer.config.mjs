import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: 'src/electron/renderer',
  build: {
    outDir: path.resolve('.vite/renderer/main_window'),
  },
  plugins: [react()],
});
