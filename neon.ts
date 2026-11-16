import { defineConfig } from '@neon/config/v1';
export default defineConfig({
  auth: true,
  functions: {
    dbstudysync: {
      name: 'DB study sync',
      source: 'functions/sync.ts',
    },
  },
});
