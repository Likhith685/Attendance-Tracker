import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: ['./tests/globalSetup.js'],
    // env.js validates configuration on import, so tests need a complete environment.
    env: {
      NODE_ENV: 'test',
      MONGO_URI: 'mongodb://tests-use-an-in-memory-server',
      JWT_SECRET: 'test-only-secret-with-at-least-32-characters',
      BCRYPT_ROUNDS: '4',
      GOOGLE_CLIENT_ID: 'test-google-client-id.apps.googleusercontent.com',
      CORS_ORIGINS: 'http://localhost:3000',
      CHECKIN_RADIUS_METERS: '200',
    },
    testTimeout: 20_000,
    hookTimeout: 120_000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
      exclude: ['src/server.js'],
    },
  },
});
