import { hasFile, hasPkgProp, parseArgs } from '../utils';
import isCI from 'is-ci';
import { run } from 'jest';
import { welcomeMsg } from '../messages';

export async function jest(opts: any) {
  welcomeMsg('test');

  process.env.BABEL_ENV = 'test';
  process.env.NODE_ENV = 'test';

  const watch = !isCI && opts['watch'] ? ['--watchAll'] : [];

  const useBuiltinConfig =
    !opts['config'] && !hasFile('jest.config.js') && !hasPkgProp('jest');

  const config = useBuiltinConfig
    ? ['--config', JSON.stringify(require('../configs/jest.config'))]
    : opts['config']
    ? ['--config', JSON.stringify(require(opts['config']))]
    : [];

  const args = parseArgs(opts, ['watch', 'quiet']);

  await run([...config, ...watch, '--passWithNoTests', ...args]);
}
