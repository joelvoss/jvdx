import path from 'path';
import * as spawn from 'cross-spawn';
import { hasFile, hasPkgProp, fromRoot, resolveBin, parseArgs } from '../utils';
import {
  welcomeMsg,
  typeCheckSuccessMsg,
  typeCheckErrorMsg,
  lintSuccessMsg,
  lintErrorMsg,
} from '../messages';

const here = (...p: string[]) => path.join(__dirname, ...p);
const hereRelative = (...p: string[]) => here(...p).replace(process.cwd(), '.');

export function lint(opts: any) {
  welcomeMsg('lint');

  const isTS = hasFile('tsconfig.json');

  const useBuiltinConfig =
    !opts['config'] &&
    !hasFile('.eslintrc') &&
    !hasFile('.eslintrc.js') &&
    !hasPkgProp('eslintConfig');

  const config = useBuiltinConfig
    ? ['--config', hereRelative('../configs/eslintrc.js')]
    : opts['config']
    ? ['--config', opts['config']]
    : [];

  const useBuiltinIgnore =
    !opts['ignore-path'] &&
    !hasFile('.eslintignore') &&
    !hasPkgProp('eslintIgnore');

  const ignore = useBuiltinIgnore
    ? ['--ignore-path', hereRelative('../configs/eslintignore')]
    : opts['ignore-path']
    ? ['--ignore-path', opts['ignore-path']]
    : [];

  const cache = !opts['no-cache']
    ? [
        '--cache',
        '--cache-location',
        fromRoot('node_modules/.cache/.eslintcache'),
      ]
    : [];

  const extensions = ['--ext', opts['ext']];

  const includeFiles = opts['ext']
    .split(',')
    .map((f: string) => (f.startsWith('.') ? `${f.slice(1)}` : f));
  const filesGiven = opts['_'] ? opts['_'].length > 0 : false;
  const filesToApply = filesGiven ? [] : ['.'];

  if (filesGiven) {
    // We need to take all the flag-less arguments (the files that should be
    // linted) and filter out the ones that aren't js|jsx|ts|tsx files.
    // Otherwise json or css files may be passed through.
    const regexp = new RegExp(`\\.+(${includeFiles.join('|')})$`);
    opts._.forEach((opt: string) => {
      if (regexp.test(opt)) {
        filesToApply.push(opt);
      }
    });
  }

  const args = parseArgs(opts, ['quiet']);

  if (isTS) {
    const tsResult = spawn.sync(
      resolveBin('typescript', { executable: 'tsc' }),
      ['--noEmit'],
      {
        stdio: 'inherit',
      },
    );
    if (tsResult.status === 0) {
      typeCheckSuccessMsg();
    } else {
      typeCheckErrorMsg();
    }
  }

  const lintResult = spawn.sync(
    resolveBin('eslint'),
    [...config, ...ignore, ...cache, ...extensions, ...args, ...filesToApply],
    { stdio: 'inherit' },
  );
  if (lintResult.status === 0) {
    lintSuccessMsg();
  } else {
    lintErrorMsg();
  }

  return lintResult.status || undefined;
}
