import path from 'path';
import * as spawn from 'cross-spawn';
import { hasFile, hasPkgProp, resolveBin, parseArgs } from '../utils';
import { welcomeMsg, formatSuccessMsg, formatErrorMsg } from '../messages';

const here = (...p: string[]) => path.join(__dirname, ...p);
const hereRelative = (...p: string[]) => here(...p).replace(process.cwd(), '.');

export function format(opts: any) {
  welcomeMsg('format');

  const useBuiltinConfig =
    !opts['config'] &&
    !hasFile('.prettierrc') &&
    !hasFile('prettier.config.js') &&
    !hasPkgProp('prettierrc');

  const config = useBuiltinConfig
    ? ['--config', hereRelative('../configs/prettierrc.js')]
    : opts['config']
    ? ['--config', opts['config']]
    : [];

  const useBuiltinIgnore = !opts['ignore-path'] && !hasFile('.prettierignore');

  const ignore = useBuiltinIgnore
    ? ['--ignore-path', hereRelative('../configs/prettierignore')]
    : opts['ignore-path']
    ? ['--ignore-path', opts['ignore-path']]
    : [];

  const write = !opts['no-write'] ? ['--write'] : [];

  const filesGiven = opts._.length > 0;
  const filesToApply = filesGiven ? [] : ['**/*.+(js|json|less|css|ts|tsx|md)'];

  if (filesGiven) {
    // This ensures that when running format as a pre-commit hook and we get
    // the full file path, we make that non-absolute so it is treated as a glob.
    // This way the prettierignore will be applied.
    opts._.forEach((a: string) => {
      filesToApply.push(a.replace(`${process.cwd()}/`, ''));
    });
  }

  const args = parseArgs(opts, ['no-write', 'quiet']);

  const result = spawn.sync(
    resolveBin('prettier'),
    [...config, ...ignore, ...write, ...args, ...filesToApply],
    { stdio: 'inherit' },
  );

  console.log();
  if (result.status === 0) {
    formatSuccessMsg();
  } else {
    formatErrorMsg();
  }

  return result.status || undefined;
}
