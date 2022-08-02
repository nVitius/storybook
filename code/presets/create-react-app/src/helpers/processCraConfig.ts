import { resolve } from 'path';
import type { Options } from '@storybook/core-common';

import { Configuration, RuleSetCondition, RuleSetRule } from 'webpack'; // eslint-disable-line import/no-extraneous-dependencies
import semver from 'semver';
import { PluginItem, TransformOptions } from '@babel/core';
import { PluginOptions } from '../types';

const isRegExp = (value: RegExp | unknown): value is RegExp => value instanceof RegExp;

const isString = (value: string | unknown): value is string => typeof value === 'string';

// This handles arrays in Webpack rule tests.
const testMatch = (rule: RuleSetRule, string: string): boolean => {
  if (!rule.test) return false;
  return Array.isArray(rule.test)
    ? rule.test.some((test) => isRegExp(test) && test.test(string))
    : isRegExp(rule.test) && rule.test.test(string);
};

export const processCraConfig = (
  craWebpackConfig: Configuration,
  options: Options & PluginOptions
): RuleSetRule[] => {
  const configDir = resolve(options.configDir);

  /*
   * NOTE: As of version 5.3.0 of Storybook, Storybook's default loaders are no
   * longer appended when using this preset, meaning less customisation is
   * needed when used alongside that version.
   *
   * When loaders were appended in previous Storybook versions, some CRA loaders
   * had to be disabled or modified to avoid conflicts.
   *
   * See: https://github.com/storybookjs/storybook/pull/9157
   */
  const storybookVersion = semver.coerce(options.packageJson.version) || '';
  const isStorybook530 = semver.gte(storybookVersion, '5.3.0');

  const craRules = (craWebpackConfig.module!.rules || []) as unknown as RuleSetRule[];
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return craRules.reduce((rules, rule): RuleSetRule[] => {
    const { oneOf, include } = rule;

    // Add our `configDir` to support JSX and TypeScript in that folder.
    if (testMatch(rule, '.jsx')) {
      const newRule = {
        ...rule,
        include: [include as string, configDir].filter(Boolean),
      };
      return [...rules, newRule];
    }

    /*
     * CRA makes use of Webpack's `oneOf` feature.
     * https://webpack.js.org/configuration/module/#ruleoneof
     *
     * Here, we map over those rules and add our `configDir` as above.
     */
    if (oneOf) {
      return [
        ...rules,
        {
          oneOf: oneOf.map((oneOfRule: RuleSetRule): RuleSetRule => {
            if (oneOfRule.type === 'asset/resource') {
              if (isStorybook530) {
                const excludes = [
                  'ejs', // Used within Storybook.
                  'md', // Used with Storybook Notes.
                  'mdx', // Used with Storybook Docs.
                  'cjs', // Used for CommonJS modules.
                  ...(options.craOverrides?.fileLoaderExcludes || []),
                ];
                const excludeRegex = new RegExp(`\\.(${excludes.join('|')})$`);
                return {
                  ...oneOfRule,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  exclude: [...(oneOfRule.exclude as RuleSetCondition[]), excludeRegex],
                };
              }
              return {};
            }

            // This rule causes conflicts with Storybook addons like `addon-info`.
            if (testMatch(oneOfRule, '.css')) {
              return {
                ...oneOfRule,
                include: isStorybook530 ? undefined : [configDir],
                exclude: [oneOfRule.exclude as RegExp, /@storybook/],
              };
            }

            // Used for the next two rules modifications.
            const isBabelLoader =
              isString(oneOfRule.loader) && /[/\\]babel-loader[/\\]/.test(oneOfRule.loader);

            // Target `babel-loader` and add user's Babel config.
            if (isBabelLoader && isRegExp(oneOfRule.test) && oneOfRule.test.test('.jsx')) {
              const { include: _include, options: ruleOptions } = oneOfRule;

              const {
                plugins: rulePlugins,
                presets: rulePresets,
                overrides: ruleOverrides,
              } = (typeof ruleOptions === 'object' ? ruleOptions : {}) as {
                plugins: PluginItem[] | null;
                presets: PluginItem[] | null;
                overrides: TransformOptions[] | null;
              };

              const { extends: _extends, plugins, presets, overrides } = options.babelOptions;

              return {
                ...oneOfRule,
                include: [_include as string, configDir].filter(Boolean),
                options: {
                  ...(ruleOptions as Record<string, unknown>),
                  extends: _extends,
                  plugins: [...(plugins ?? []), ...(rulePlugins ?? [])],
                  presets: [...(presets ?? []), ...(rulePresets ?? [])],
                  overrides: [...(overrides ?? []), ...(ruleOverrides ?? [])],
                },
              };
            }

            // Target `babel-loader` that processes `node_modules`, and add Storybook config dir.
            if (isBabelLoader && isRegExp(oneOfRule.test) && oneOfRule.test.test('.js')) {
              return {
                ...oneOfRule,
                include: [configDir],
              };
            }

            return oneOfRule;
          }),
        },
      ];
    }

    return [...rules, rule] as RuleSetRule[];
  }, [] as RuleSetRule[]);
};