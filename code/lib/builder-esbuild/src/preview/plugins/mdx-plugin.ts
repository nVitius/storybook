import type { Options } from '@storybook/types';
import type { Plugin } from 'esbuild';
import remarkSlug from 'remark-slug';
import remarkExternalLinks from 'remark-external-links';
import fs from 'fs';
import path from 'path';

const isStorybookMdx = (id: string) => id.endsWith('stories.mdx') || id.endsWith('story.mdx');

export function mdxPlugin(options: Options): Plugin {
  const { features, presets } = options;

  return {
    name: 'storybook:mdx-plugin',
    setup(build) {
      build.onResolve({ filter: /\.mdx$/ }, (args) => ({
        path: args.path,
        namespace: 'storybook-mdx-plugin',
      }));

      build.onLoad({ filter: /\.*$/, namespace: 'storybook-mdx-plugin' }, async (args) => {
        const { mdxPluginOptions, jsxOptions } = await presets.apply<Record<string, any>>(
          'options',
          {}
        );

        const { compile } = features?.legacyMdx1
          ? await import('@storybook/mdx1-csf')
          : await import('@storybook/mdx2-csf');

        const mdxLoaderOptions = await options.presets.apply('mdxLoaderOptions', {
          ...mdxPluginOptions,
          mdxCompileOptions: {
            providerImportSource: '@storybook/addon-docs/mdx-react-shim',
            ...mdxPluginOptions?.mdxCompileOptions,
            remarkPlugins: [remarkSlug, remarkExternalLinks].concat(
              mdxPluginOptions?.mdxCompileOptions?.remarkPlugins ?? []
            ),
          },
          jsxOptions,
        });

        const content = fs.readFileSync(args.path, { encoding: 'utf-8' });

        const code = String(
          await compile(content, {
            skipCsf: !isStorybookMdx(args.path),
            ...mdxLoaderOptions,
          })
        );

        return {
          contents: code,
          loader: 'jsx',
          resolveDir: path.dirname(args.path),
        };
      });
    },
  };
}
