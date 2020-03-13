import rimraf from 'rimraf';
import spawn from 'cross-spawn';
import { rollup, watch, RollupOptions, OutputOptions } from 'rollup';
import { hasDep, hasFile, fromRoot, asyncMap, resolveBin } from '../../utils';
import {
  welcomeMsg,
  runtimeHelperMsg,
  rollupChunkSuccessMsg,
  rollupChunkErrorMsg,
  rollupWatchError,
  rollupWatchMsg,
  rollupBuildSuccessMsg,
  generateTypeDefSuccessMsg,
  generateTypeDefErrorMsg,
  rollupBuildStartMsg,
} from '../../messages';

// requireUncached requires modules without cache hits
const requireUncached = (module: string) => {
  delete require.cache[require.resolve(module)];
  return require(module);
};

export async function build(input: string, opts: any) {
  welcomeMsg('build rollup');

  // Check if we build a TS package
  const isTS = hasFile('tsconfig.json');

  // Determine what config file to use
  const useBuiltinConfig = !opts['config'] && !hasFile('rollup.config.js');
  const config = useBuiltinConfig
    ? '../../configs/rollup.config.js'
    : !opts['config']
    ? fromRoot('rollup.config.js')
    : fromRoot(opts['config']);

  // Set watch mode and output directory
  const watchMode = opts['watch'] || false;
  const outputDir = opts['dir'];

  // Parse the target format string
  let formats = opts['format'].split(',');

  // Check if we are using the @babel/runtime helper when building UMD.
  // If not, warn about it.
  if (
    formats.some((f: string) => !f.startsWith('umd')) &&
    !hasDep('@babel/runtime')
  ) {
    runtimeHelperMsg();
  }

  // Set default environment settings
  const environment = !opts['environment']
    ? 'BUILD_ROLLUP:true'
    : `BUILD_ROLLUP:true,${opts['environment']}`;

  // Should we clean the output directory before building?
  const cleanBuildDirs = opts['clean'];
  if (cleanBuildDirs) {
    rimraf.sync(fromRoot(outputDir));
  }

  // Create `rollupOptions` for each format
  const rollupOptions = formats.map((format: string) => {
    const [formatName, minify = false] = format.split('.');
    const nodeEnv = minify ? 'production' : 'development';
    const sourceMap = Boolean(formatName === 'umd');
    const buildMinify = Boolean(minify);

    const envStr =
      `${environment}` +
      `,BUILD_INPUT:${input}` +
      `,BUILD_OUTPUT:${outputDir}` +
      `,BUILD_FORMAT:${formatName}` +
      `${watchMode ? ',BUILD_WATCHMODE:true' : ''}` +
      `${buildMinify ? ',BUILD_MINIFY:true' : ''}` +
      `${isTS ? ',BUILD_TS:true' : ''}` +
      `,NODE_ENV:${nodeEnv}` +
      `${sourceMap ? ',BUILD_SOURCEMAP:true' : ''}`;

    envStr.split(',').forEach(e => {
      const [key, value] = e.split(':');
      process.env[key] = value;
    });

    return requireUncached(config);
  });

  // If we are *not* in watch mode, build the package using rollup...
  if (!opts['watch']) {
    const builds = asyncMap(
      rollupOptions,
      async (
        options: RollupOptions & { output: [OutputOptions] },
        index: number,
      ) => {
        try {
          let bundle = await rollup(options);
          await bundle.write(options.output[0]);
          return {
            error: null,
            format: formats[index],
          };
        } catch (err) {
          return {
            error: err.message || err,
            format: formats[index],
          };
        }
      },
    );

    try {
      const results = await builds;
      for (let result of results) {
        if (result.error) {
          rollupChunkErrorMsg(result.format, result.error);
        } else {
          rollupChunkSuccessMsg(result.format);
        }
      }
      isTS && writeTypes(outputDir);
    } catch (err) {
      // handle Promise.all error (if any)
    }
  } else {
    // ...else watch it
    rollupWatchMsg();
    watch(rollupOptions).on('event', async event => {
      if (event.code === 'START') {
        rollupBuildStartMsg();
      }
      if (event.code === 'ERROR') {
        rollupWatchError(event.code, event.error);
      }
      if (event.code === 'END') {
        rollupBuildSuccessMsg(rollupOptions.length);
      }
    });
  }
}

function writeTypes(outDir: string) {
  // Generate types
  const result = spawn.sync(
    resolveBin('typescript', { executable: 'tsc' }),
    ['--declarationDir', `${outDir}/types`, '--emitDeclarationOnly'],
    { stdio: 'ignore' },
  );

  if (result.status === 0) {
    generateTypeDefSuccessMsg();
  } else {
    generateTypeDefErrorMsg();
  }
}
