import fs from 'fs';
import path from 'path';
import arrify from 'arrify';
import which from 'which';
import has from 'lodash/has';
import readPkgUp, { PackageJson } from 'read-pkg-up';
import spawn from 'cross-spawn';
const rpu = readPkgUp.sync({
  cwd: fs.realpathSync(process.cwd()),
  normalize: false,
}) as readPkgUp.ReadResult;
export const packageJson: PackageJson | undefined = rpu?.packageJson;

export const appDir = path.dirname(rpu?.path || '');

export const fromRoot = (...p: string[]) => path.join(appDir, ...p);

export const hasFile = (...p: string[]) => fs.existsSync(fromRoot(...p));

export const hasPkgProp = (props: string | string[]) =>
  arrify(props).some((prop: string) => has(rpu?.packageJson, prop));

export const hasPkgSubProp = (pkgProp: string) => (
  props: string | string[],
) => {
  const p = arrify(props).map(p => `${pkgProp}.${p}`);
  return hasPkgProp(p);
};

export const hasDep = hasPkgSubProp('dependencies');
export const hasDevDep = hasPkgSubProp('devDependencies');
export const hasPeerDep = hasPkgSubProp('peerDependencies');

export const hasAnyDep = (args: string | string[]) =>
  [hasDep, hasDevDep, hasPeerDep].some(fn => fn(args));

export const ifAnyDep = (deps: string | string[], t: any, f: any) =>
  hasAnyDep(arrify(deps)) ? t : f;

const regex = '@[a-z\\d][\\w-.]+/';
export function removePkgScope(str: string, options?: { exact: boolean }) {
  let regexp = new RegExp(regex, 'gi');
  if (options && options.exact) {
    regexp = new RegExp(`^${regex}$`, 'i');
  }
  return str.replace(regexp, '');
}

// Resolve dependency by name
export function resolveBin(
  depName: string,
  { executable = removePkgScope(depName), cwd = process.cwd() } = {},
) {
  let pathFromWhich;
  try {
    pathFromWhich = fs.realpathSync(which.sync(executable));
    if (pathFromWhich && pathFromWhich.includes('.CMD')) return pathFromWhich;
  } catch (_error) {
    // silence is golden
  }

  try {
    const modPkgPath = require.resolve(`${depName}/package.json`);
    const modPkgDir = path.dirname(modPkgPath);
    const { bin } = require(modPkgPath);
    const binPath = typeof bin === 'string' ? bin : bin[executable];
    const fullPathToBin = path.join(modPkgDir, binPath);
    if (fullPathToBin === pathFromWhich) {
      return executable;
    }
    return fullPathToBin.replace(cwd, '.');
  } catch (error) {
    if (pathFromWhich) {
      return executable;
    }
    throw error;
  }
}

export function parseArgs(opts: any, keysToFilter?: string[]): string[] {
  const filterOut = ['_', ...(keysToFilter ? keysToFilter : [])];
  let args: string[] = [];
  for (let o in opts) {
    if (opts[o] && !filterOut.includes(o)) {
      args = [...args, `--${o}`, ...(opts[o] === true ? [] : [opts[o]])];
    }
  }
  return args;
}

export function parseEnv(name: string | number, d: any) {
  if (
    // process.env.hasOwnProperty(name) &&
    process.env[name] &&
    process.env[name] !== 'undefined'
  ) {
    try {
      return JSON.parse(process.env[name]!);
    } catch (err) {
      return process.env[name];
    }
  }
  return d;
}

export function asyncMap(
  array: [],
  mapper: (value: any, index: number, array: any[]) => any,
) {
  return Promise.all(array.map(mapper));
}

export function getWatchInclude(input: string | string[]) {
  // handle an array inout
  if (Array.isArray(input)) {
    return input.map(filePath => {
      const splits = filePath.split('/');
      if (splits.length >= 2) {
        return `${splits.slice(0, splits.length - 1).join('/')}/**`;
      }
      return `./**`;
    });
  } else {
    const splits = input.split('/');
    if (splits.length >= 2) {
      return [`${splits.slice(0, splits.length - 1).join('/')}/**`];
    }
    return [`./**`];
  }
}

export function yarnOrNpm() {
  const result = spawn.sync('yarnpkg', ['--version'], { stdio: 'pipe' });
  if (result.status === 0) {
    return { cmd: 'yarn', args: ['add'] };
  } else {
    return { cmd: 'npm', args: ['install'] };
  }
}
