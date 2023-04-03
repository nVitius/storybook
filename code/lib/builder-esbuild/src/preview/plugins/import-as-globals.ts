import type { Plugin } from 'esbuild';
import escapeStringRegexp from 'escape-string-regexp';
import dedent from 'ts-dedent';

export function importAsGlobals(mapping: Record<string, string>): Plugin {
  const filter = new RegExp(
    Object.keys(mapping)
      .map((mod) => `^${escapeStringRegexp(mod)}$`)
      .join('|')
  );

  return {
    name: 'global-imports',
    setup(build) {
      build.onResolve({ filter }, (args) => {
        if (!mapping[args.path]) {
          throw new Error(`Unknown global: ${args.path}`);
        }
        return {
          path: args.path,
          namespace: 'external-global',
        };
      });

      build.onLoad(
        {
          filter,
          namespace: 'external-global',
        },
        async (args) => {
          const global = mapping[args.path];
          return {
            contents: dedent`
              module.exports = ${global};
            `,
            loader: 'js',
          };
        }
      );
    },
  };
}
