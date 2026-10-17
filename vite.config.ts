import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import { pagesBase } from './src/lib/base';
export default defineConfig({plugins:[react(),tailwind()],base:pagesBase(process.env.GITHUB_REPOSITORY),test:{include:['tests/**/*.test.ts']}});
