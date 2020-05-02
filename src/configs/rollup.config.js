const path = require('path');
const glob = require('glob');
const camelCase = require('lodash/camelCase');
const capitalize = require('lodash/capitalize');
const upperFirst = require('lodash/upperFirst');
const omit = require('lodash/omit');
const replace = require('@rollup/plugin-replace');
const { babel } = require('@rollup/plugin-babel');
const { DEFAULT_EXTENSIONS } = require('@babel/core');
const commonjs = require('@rollup/plugin-commonjs');
const nodeResolve = require('@rollup/plugin-node-resolve');
const builtins = require('builtin-modules');
const json = require('@rollup/plugin-json');
const { eslint } = require('rollup-plugin-eslint');
const { terser } = require('rollup-plugin-terser');
const {
  packageJson,
  parseEnv,
  fromRoot,
  hasFile,
  hasPkgProp,
  getWatchInclude,
} = require('../utils');

// requireUncached requires modules without cache hits
const requireUncached = module => {
  delete require.cache[require.resolve(module)];
  return require(module);
};

// Parse environment variables
const outputDir = parseEnv('BUILD_OUTPUT', 'dist');
const watchMode = parseEnv('BUILD_WATCHMODE', false);
const minify = parseEnv('BUILD_MINIFY', false);
const sourcemap = parseEnv('BUILD_SOURCEMAP', false);
const format = parseEnv('BUILD_FORMAT');
const name = parseEnv('BUILD_NAME', upperFirst(camelCase(packageJson.name)));
const filenameSuffix = parseEnv('BUILD_FILENAME_SUFFIX', '');
const filenamePrefix = parseEnv('BUILD_FILENAME_PREFIX', '');
const buildInput = parseEnv('BUILD_INPUT', 'src/index.ts');

// Generate list of global modules
const globals = parseEnv(
  'BUILD_GLOBALS',
  Object.keys(packageJson.peerDependencies || {}).reduce((deps, dep) => {
    deps[dep] = capitalize(camelCase(dep));
    return deps;
  }, {}),
);

// Extend the default extensions
const extensions = [...DEFAULT_EXTENSIONS, '.ts', '.tsx'];

// What type of bundle are we building?
const esm = format === 'esm';
const umd = format === 'umd';
const cjs = format === 'cjs';

// Generate list of external dependencies
const deps = Object.keys(packageJson.dependencies || {});
const peerDeps = Object.keys(packageJson.peerDependencies || {});
const defaultExternal = umd ? peerDeps : deps.concat(peerDeps, builtins);
const external = parseEnv('BUILD_EXTERNAL', defaultExternal).filter(
  (e, i, arry) => arry.indexOf(e) === i,
);
const externalPattern = new RegExp(`^(${external.join('|')})($|/)`);
function externalPredicate(id) {
  const isDep = external.length > 0 && externalPattern.test(id);
  if (umd) {
    // for UMD, we want to bundle all non-peer deps
    return isDep;
  }
  // for esm/cjs we want to make all node_modules external
  const isNodeModule = id.includes('node_modules');
  const isRelative = id.startsWith('.');
  return isDep || (!isRelative && !path.isAbsolute(id)) || isNodeModule;
}

const input = glob.sync(fromRoot(buildInput));
const dirpath = path.join(...[filenamePrefix, outputDir].filter(Boolean));

const entryFileNames = [
  '[name]',
  filenameSuffix,
  `.[format]`,
  minify ? '.min' : null,
  '.js',
]
  .filter(Boolean)
  .join('');

const chunkFileNames = [
  '[name]-[hash]',
  filenameSuffix,
  `.[format]`,
  minify ? '.min' : null,
  '.js',
]
  .filter(Boolean)
  .join('');

const output = [
  {
    name,
    dir: path.join(dirpath, format),
    entryFileNames,
    chunkFileNames,
    format,
    exports: esm ? 'named' : 'auto',
    globals,
    sourcemap,
  },
];

const useBuiltinConfig =
  !hasFile('.babelrc') &&
  !hasFile('.babelrc.js') &&
  !hasFile('babel.config.js') &&
  !hasPkgProp('babel');
const babelrc = useBuiltinConfig
  ? requireUncached('../configs/babelrc.js')
  : null;

const replacements = Object.entries(
  umd ? process.env : omit(process.env, ['NODE_ENV']),
).reduce((acc, [key, value]) => {
  let val;
  if (value === 'true' || value === 'false' || Number.isInteger(+value)) {
    val = value;
  } else {
    val = JSON.stringify(value);
  }
  acc[`process.env.${key}`] = val;
  return acc;
}, {});

// Shebang cache
const shebangCache = {};

module.exports = {
  input: input.length > 1 ? input : input[0],
  output,
  external: externalPredicate,
  plugins: [
    nodeResolve({
      mainFields: ['module', 'main', 'jsnext', 'browser'],
      extensions,
    }),
    commonjs({ include: 'node_modules/**' }),
    json(),
    eslint({
      throwOnError: true,
    }),
    babel({
      presets: babelrc.presets,
      plugins: babelrc.plugins,
      babelrc: !useBuiltinConfig,
      babelHelpers: useBuiltinConfig ? 'runtime' : 'bundled',
      extensions,
    }),
    replace(replacements),
    {
      // Custom plugin that removes shebang from code because newer
      // versions of bublé bundle their own private version of `acorn`
      // and I don't know a way to patch in the option `allowHashBang`
      // to acorn. Taken from microbundle.
      // See: https://github.com/Rich-Harris/buble/pull/165
      transform(code) {
        let reg = /^#!(.*)/;
        let match = code.match(reg);
        shebangCache[name] = match ? '#!' + match[1] : '';
        code = code.replace(reg, '');
        return {
          code,
          map: null,
        };
      },
    },
    minify
      ? terser({
          sourcemap: true,
          output: { comments: false },
          compress: {
            keep_infinity: true,
            pure_getters: true,
            passes: 10,
          },
          ecma: 5,
          toplevel: cjs,
          warnings: true,
        })
      : null,
  ],
  ...(watchMode
    ? {
        watch: {
          silent: true,
          include: [...getWatchInclude(buildInput)],
          exclude: ['node_modules/**'],
        },
      }
    : {}),
};
