import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  clean: true,
  format: ['cjs', 'esm'],
  outDir: 'dist',
  dts: true,
});
