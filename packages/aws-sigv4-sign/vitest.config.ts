import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'unit/aws-sigv4-sign',
    include: ['src/**/*.test.{ts,js}'],
  },
});
