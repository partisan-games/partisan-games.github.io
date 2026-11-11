import { defineConfig, devices } from '@playwright/test'

const port = 4173

export default defineConfig({
  testDir: 'tests/smoke',
  outputDir: 'test-results',
  timeout: 90_000,
  fullyParallel: true,
  workers: 4,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${port}`,
    screenshot: 'only-on-failure',
    launchOptions: {
      // headless Chromium needs software WebGL for the 3D scenes
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
    },
  },
  projects: [
    { name: 'desktop', testIgnore: /phone\.spec/, use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'phone', testMatch: /phone\.spec/, use: devices['Pixel 7'] },
  ],
  webServer: {
    command: 'node scripts/serve.js',
    env: { PORT: String(port) },
    url: `http://localhost:${port}`,
    reuseExistingServer: true,
  },
})
