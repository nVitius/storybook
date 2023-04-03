import type { BuildOptions } from 'esbuild';
import type { Options } from '@storybook/types';

export interface StorybookConfigEsbuild {
  /**
   * Modify or return a custom Webpack config after the Storybook's default configuration
   * has run (mostly used by addons).
   */
  esbuild?: (config: BuildOptions, options: Options) => BuildOptions | Promise<BuildOptions>;

  /**
   * Modify or return a custom Webpack config after every addon has run.
   */
  esbuildFinal?: (config: BuildOptions, options: Options) => BuildOptions | Promise<BuildOptions>;
}
