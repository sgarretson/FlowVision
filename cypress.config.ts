import { defineConfig } from 'cypress';

const baseUrl =
  process.env.CYPRESS_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002';

export default defineConfig({
  e2e: {
    baseUrl,
  },
});
