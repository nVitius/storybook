import type { StorybookConfig as StorybookConfigBase } from '@storybook/types';
import type { StorybookConfigEsbuild } from '@storybook/builder-esbuild';

type FrameworkName = '@storybook/react-esbuild';
type BuilderName = '@storybook/builder-esbuild';

type StorybookConfigFramework = {
  framework:
    | FrameworkName
    | {
        name: FrameworkName;
        options: any;
      };
  core?: StorybookConfigBase['core'] & {
    builder?:
      | BuilderName
      | {
          name: BuilderName;
          options: any;
        };
  };
};

/**
 * The interface for Storybook configuration in `main.ts` files.
 */
export type StorybookConfig = Omit<StorybookConfigBase, keyof StorybookConfigFramework> &
  StorybookConfigEsbuild &
  StorybookConfigFramework;
