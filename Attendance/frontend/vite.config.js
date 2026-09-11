import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  // Fail fast instead of shipping a bundle that points at localhost.
  if (mode === 'production' && !env.VITE_API_URL) {
    throw new Error(
      'VITE_API_URL must be set for production builds, e.g. VITE_API_URL=https://api.example.com',
    );
  }

  return {
    plugins: [react()],
    server: { port: 3000 },
    preview: { port: 3000 },
    build: { outDir: 'build' },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.js'],
      css: false,
      restoreMocks: true,
      // Keep tests independent of a developer's local .env.
      env: { VITE_API_URL: '', VITE_GOOGLE_CLIENT_ID: '' },
    },
  };
});
