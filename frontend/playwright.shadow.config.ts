import { defineConfig } from '@playwright/test';
import base from './playwright.config';

// The rider's shadow, looked at (L2-174 AC12, docs/shadow-iterations.md): pictures of the rider and their shadow at
// places round the course where the sun stands differently to the bike, laid out as one sheet. Like the sweeps and
// the heap checks it is run only when a person asks, never by verify or CI; it asserts nothing about the picture.
// It reads a development build served at SHADOW_PORT (4311), which the person starts:
//   npx ng build ride --configuration development --output-path dist/shadow-dev --watch
//   node scripts/serve-dist.mjs 4311 dist/shadow-dev/browser
//   npx playwright test -c playwright.shadow.config.ts
const port = Number(process.env['SHADOW_PORT'] ?? 4311);

export default defineConfig({
  ...base,
  testMatch: '**/*.shots.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 10 * 60_000,
  reporter: 'list',
  use: {
    ...base.use,
    baseURL: `http://localhost:${port}`,
    trace: 'off',
    // SHADOW_WEBGPU=1 asks headless Chromium for WebGPU, so the pictures are of that backend, not of WebGL 2.
    launchOptions: process.env['SHADOW_WEBGPU']
      ? { args: ['--enable-unsafe-webgpu', '--enable-features=Vulkan', '--use-angle=swiftshader'] }
      : {},
  },
  projects: [{ name: 'shadow' }],
  webServer: undefined,
});
