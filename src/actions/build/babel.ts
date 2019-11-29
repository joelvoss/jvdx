import path from 'path';
import mkdirp from 'mkdirp';
import * as fs from 'fs-extra';
import * as spawn from 'cross-spawn';
import rimraf from 'rimraf';
import glob from 'glob';
import { loadOptions, transformFileSync, TransformOptions } from '@babel/core';
import { hasFile, hasPkgProp, fromRoot, resolveBin, hasDep } from '../../utils';
import {
  welcomeMsg,
  runtimeHelperMsg,
  babelGlobErrorMsg,
  babelWriteChunkMsg,
  babelBuildSuccessMsg,
  babelBuildErrorMsg,
  generateTypeDefSuccessMsg,
  generateTypeDefErrorMsg,
} from '../../messages';

// requireUncached requires modules without cache hits
const requireUncached = (module: string) => {
  delete require.cache[require.resolve(module)];
  return require(module);
};

export function build(input: string, opts: any) {
  welcomeMsg('build babel');

  // Check if we are using the @babel/runtime helper when building UMD.
  // If not, warn about it.
  if (!hasDep('@babel/runtime')) {
    runtimeHelperMsg();
  }

  // Check if we build a TS package
  const isTS = hasFile('tsconfig.json');

  // Set environment variables so the babelrc.js sets the corrent presets
  const envStr = `NODE_ENV:production${isTS ? ',BUILD_TS:true' : ''}`;
  envStr.split(',').forEach(e => {
    const [key, value] = e.split(':');
    process.env[key] = value;
  });

  // Determine what config file to use
  const useBuiltinConfig =
    !hasFile('.babelrc') &&
    !hasFile('.babelrc.js') &&
    !hasFile('babel.config.js') &&
    !hasPkgProp('babel');
  const babelrc = useBuiltinConfig
    ? requireUncached('../../configs/babelrc.js')
    : null;

  const exclude = opts['ignore'] ? opts['ignore'].split(',') : [];

  const files = glob
    .sync(input, { nodir: true, ignore: exclude })
    .filter(filepath => {
      return !filepath.endsWith('.d.ts') && !filepath.includes('README');
    });

  if (files.length === 0) {
    babelGlobErrorMsg(input);
  }

  // Define the output directory
  const outputDir = opts['out-dir'];

  // Should we clean the output directory?
  if (opts['clean']) {
    rimraf.sync(fromRoot(opts['out-dir']));
  }

  const result = new Map();

  try {
    for (const sourcePath of files) {
      const transformedPath = sourcePath
        .replace('.ts', '.js')
        .replace('.tsx', '.js')
        .replace('.jsx', '.js')
        .replace('.mjs', '.js')
        .split('/')
        .slice(1)
        .join('/');

      const hasExt =
        sourcePath.slice(((sourcePath.lastIndexOf('.') - 1) >>> 0) + 2).length >
        0;
      if (!hasExt) {
        result.set(transformedPath, fs.readFileSync(sourcePath));
      } else {
        const options = loadOptions({ filename: sourcePath, ...babelrc }) as
          | TransformOptions
          | undefined;
        const resultSrc = transformFileSync(sourcePath, options);
        result.set(transformedPath, resultSrc?.code);
      }
    }

    // Write compiled files to disk
    for (const [filepath, contents] of result.entries()) {
      const transformedPathAbs = path.join(outputDir, filepath);
      mkdirp.sync(path.dirname(transformedPathAbs));
      fs.writeFileSync(transformedPathAbs, contents);
      babelWriteChunkMsg(transformedPathAbs);
    }

    // Generate types
    if (isTS) {
      const result = spawn.sync(
        resolveBin('typescript', { executable: 'tsc' }),
        [
          '--declarationDir',
          `${opts['out-dir']}/types`,
          '--emitDeclarationOnly',
        ],
        { stdio: 'ignore' },
      );

      if (result.status === 0) {
        generateTypeDefSuccessMsg();
      } else {
        generateTypeDefErrorMsg();
      }
    }

    babelBuildSuccessMsg(result.size);
    return 0;
  } catch (err) {
    babelBuildErrorMsg(err);
    return 1;
  }
}
