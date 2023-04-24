import chalk from 'chalk';
import { frameworkPackages, rendererPackages } from '@storybook/core-common';
import { hasMultipleVersions } from './hasMultipleVersions';
import type { InstallationMetadata } from '../../js-package-manager/types';

export const messageDivider = '\n\n';

// These packages are aliased by Storybook, so it doesn't matter if they're duplicated
export const allowList = [
  '@storybook/csf',
  // see this file for more info: code/lib/preview/src/globals/types.ts
  '@storybook/addons',
  '@storybook/channel-postmessage',
  '@storybook/channel-websocket',
  '@storybook/channels',
  '@storybook/client-api',
  '@storybook/client-logger',
  '@storybook/core-client',
  '@storybook/core-events',
  '@storybook/preview-web',
  '@storybook/preview-api',
  '@storybook/store',

  // see this file for more info: code/ui/manager/src/globals/types.ts
  '@storybook/components',
  '@storybook/router',
  '@storybook/theming',
  '@storybook/api',
  '@storybook/manager-api',
];

// These packages definitely will cause issues if they're duplicated
export const disallowList = [
  Object.keys(rendererPackages),
  Object.keys(frameworkPackages),
  '@storybook/instrumenter',
];

export function getDuplicatedDepsWarnings(
  installationMetadata?: InstallationMetadata
): string[] | undefined {
  if (
    !installationMetadata?.duplicatedDependencies ||
    Object.keys(installationMetadata.duplicatedDependencies).length === 0
  ) {
    return undefined;
  }

  const messages: string[] = [];

  const { critical, trivial } = Object.entries(
    installationMetadata?.duplicatedDependencies
  ).reduce<{
    critical: string[];
    trivial: string[];
  }>(
    (acc, [dep, versions]) => {
      if (allowList.includes(dep)) {
        return acc;
      }

      const hasMultipleMajorVersions = hasMultipleVersions(versions);

      if (disallowList.includes(dep) && hasMultipleMajorVersions) {
        acc.critical.push(`${chalk.redBright(dep)}:\n${versions.join(', ')}`);
      } else {
        acc.trivial.push(`${chalk.hex('#ff9800')(dep)}:\n${versions.join(', ')}`);
      }

      return acc;
    },
    { critical: [], trivial: [] }
  );

  if (critical.length > 0) {
    messages.push(
      `${chalk.bold(
        'Critical:'
      )} The following dependencies are duplicated and WILL cause unexpected behavior:`
    );
    messages.push(critical.join(messageDivider));
  }

  if (trivial.length > 0) {
    messages.push(
      `${chalk.bold(
        'Attention:'
      )} The following dependencies are duplicated which might cause unexpected behavior:`
    );
    messages.push(trivial.join(messageDivider));
  }

  messages.push(
    `You can find more information for a given dependency by running ${chalk.cyan(
      `${installationMetadata.infoCommand} <package-name>`
    )}`
  );

  return messages;
}
