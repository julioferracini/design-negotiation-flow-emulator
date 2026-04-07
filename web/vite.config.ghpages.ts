import path from 'path';
import { mergeConfig, defineConfig } from 'vite';
import baseConfig from './vite.config';

export default mergeConfig(baseConfig, defineConfig({
  base: '/design-negotiation-flow-emulator/',
  resolve: {
    alias: {
      '@nubank/nuds-vibecode-tokens': path.resolve(__dirname, 'src/stubs/nuds-vibecode-tokens.ts'),
    },
  },
}));
