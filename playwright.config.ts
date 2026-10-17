import {defineConfig,devices} from '@playwright/test';
const repo=process.env.GITHUB_REPOSITORY?.split('/')[1];
const base=repo&&!repo.endsWith('.github.io')?`/${repo}/`:'/';
export default defineConfig({testDir:'tests/e2e',fullyParallel:true,use:{baseURL:process.env.PLAYWRIGHT_BASE_URL||`http://127.0.0.1:4173${base}`,trace:'retain-on-failure'},projects:[{name:'desktop',use:{...devices['Desktop Chrome']}},{name:'mobile',use:{...devices['Pixel 7']}}],webServer:process.env.PLAYWRIGHT_BASE_URL?undefined:{command:'npm run preview -- --port 4173',url:`http://127.0.0.1:4173${base}`,reuseExistingServer:!process.env.CI},reporter:'list'});
