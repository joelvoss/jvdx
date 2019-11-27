import path from 'path';
import * as spawn from 'cross-spawn';
import { resolveBin, hasFile, hasPkgProp, parseArgs } from '../utils';

const here = (...p: string[]) => path.join(__dirname, ...p);
const hereRelative = (...p: string[]) => here(...p).replace(process.cwd(), '.');

export function preCommit(opts: any) {
  const useBuiltInConfig =
    !opts['config'] &&
    !hasFile('.lintstagedrc') &&
    !hasFile('lint-staged.config.js') &&
    !hasPkgProp('lint-staged');

  const config = useBuiltInConfig
    ? ['--config', hereRelative('../configs/lintstagedrc.js')]
    : [];

  const args = parseArgs(opts);

  const result = spawn.sync(resolveBin('lint-staged'), [...config, ...args], {
    stdio: 'inherit',
  });

  return result.status || undefined;
}
