/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    environmentMatchGlobs: [
      ['server/**', 'node'],
    ],
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.ts'],
    // Never run tests from nested worktrees/copies of the repo. `.kilo/worktrees/*` is a
    // stale full copy of the project, and its tests were executing against the LIVE
    // Turso Cloud database (it has its own unpatched copy of db/database.ts) while
    // silently inflating the reported test count. Only the root project is tested.
    exclude: ['node_modules/**', 'dist/**', 'dev-dist/**', '.kilo/**', '.git/**'],
  },
});
