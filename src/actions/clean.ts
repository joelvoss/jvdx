import * as spawn from 'cross-spawn';
import { welcomeMsg, cleanSuccessMsg, cleanErrorMsg } from '../messages';

export function clean(opts: any) {
  welcomeMsg('clean');

  const filesToApply = [
    'node_modules',
    'package-lock.json',
    'yarn.lock',
    ...opts['_'],
  ];

  const result = spawn.sync('rm', ['-rf', ...filesToApply], {
    stdio: 'inherit',
  });

  if (result.status === 0) {
    cleanSuccessMsg(filesToApply);
  } else {
    cleanErrorMsg();
  }
  return result.status || undefined;
}
