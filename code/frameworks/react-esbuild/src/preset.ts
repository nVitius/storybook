import type { PresetProperty } from '@storybook/types';
import { dirname, join } from 'path';
import type { StorybookConfig } from './types';

const wrapForPnP = (input: string) => dirname(require.resolve(join(input, 'package.json')));

export const core: PresetProperty<'core', StorybookConfig> = {
  builder: wrapForPnP('@storybook/builder-esbuild') as '@storybook/builder-esbuild',
  renderer: wrapForPnP('@storybook/react'),
};

export const esbuildFinal: StorybookConfig['esbuildFinal'] = async (config) => {
  // TODO: Add docgen plugin

  return config;
};
