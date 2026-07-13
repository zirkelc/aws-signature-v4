import { coverageConfigDefaults, defineConfig } from 'vitest/config';

/**
 * Root config. Holds the options that Vitest only supports at the root level
 * (projects, reporters, coverage). Per-project options live in each
 * workspace package's own `vitest.config.ts`.
 */
export default defineConfig({
  test: {
    // https://vitest.dev/guide/projects.html
    projects: ['packages/*', 'test/*'],

    // https://vitest.dev/guide/reporters.html#github-actions-reporter
    reporters: process.env.GITHUB_ACTIONS ? ['default', 'github-actions'] : ['default'],

    // https://vitest.dev/guide/coverage.html
    coverage: {
      ...coverageConfigDefaults,
      provider: 'v8',
      // json-summary is required for https://github.com/davelosert/vitest-coverage-report-action
      reporter: ['json-summary', 'json', 'text-summary', 'html'],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 80,
      },
    },
  },
});
