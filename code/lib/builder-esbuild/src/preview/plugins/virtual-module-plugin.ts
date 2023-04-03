import type { Plugin } from 'esbuild';
import escapeStringRegexp from 'escape-string-regexp';

type Options = {
  virtualModuleMap: Record<string, string>;
};

export const virtualModulePlugin = (options: Options): Plugin => {
  return {
    name: 'virtual-module',
    setup(build) {
      Object.entries(options.virtualModuleMap).forEach(([path, content]) => {
        const filter = RegExp(`${escapeStringRegexp(path)}$`);

        build.onResolve({ filter }, (args) => {
          return {
            path: args.path,
            namespace: 'virtual-module',
          };
        });

        console.log({ filter });

        build.onResolve({ filter, namespace: 'virtual-module' }, (args) => {
          console.log('onResolve', args);

          return {
            path: args.path,
            namespace: 'virtual-module',
          };
        });

        build.onLoad({ filter, namespace: 'virtual-module' }, () => {
          return {
            // TODO?!
            resolveDir: process.cwd(),
            contents: content,
          };
        });
      });
    },
  };
};
