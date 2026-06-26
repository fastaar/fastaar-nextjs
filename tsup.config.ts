import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/actions.ts', 'src/components.tsx', 'src/client.ts', 'src/webhook.ts', 'src/types.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  bundle: false,
});
