const browserslist = require('browserslist');
const semver = require('semver');

const { ifAnyDep, parseEnv, appDir, packageJson } = require('../utils');

const { BABEL_ENV, NODE_ENV, BUILD_FORMAT } = process.env;
const isTest = (BABEL_ENV || NODE_ENV) === 'test';
const isRollup = parseEnv('BUILD_ROLLUP', false);
const isWebpack = parseEnv('BUILD_WEBPACK', false);
const treeshake = parseEnv('BUILD_TREESHAKE', isRollup || isWebpack);
const isTS = parseEnv('BUILD_TS', false);
const isUMD = BUILD_FORMAT === 'umd';
const isCJS = BUILD_FORMAT === 'cjs';
const alias = parseEnv('BUILD_ALIAS');

/**
 * Use the strategy declared by browserslist to load browsers configuration.
 * fallback to the default if don't found custom configuration
 * @see https://github.com/browserslist/browserslist/blob/master/node.js#L139
 */
const browsersConfig = browserslist.loadConfig({ path: appDir }) || [
  'last 2 versions',
  'not dead',
  '> 0.2%',
];

const envTargets = isTest
  ? { node: 'current' }
  : isWebpack || isRollup
  ? { browsers: browsersConfig }
  : { node: getNodeVersion(packageJson) };

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      { modules: false, loose: true, targets: envTargets, bugfixes: true },
    ],
    ifAnyDep(['react'], ['@babel/preset-react']),
    isTS ? ['@babel/preset-typescript'] : null,
  ].filter(Boolean),
  plugins: [
    // Enables the re-use of Babel's injected helper code to save on codesize
    ['@babel/plugin-transform-runtime', { useESModules: treeshake && !isCJS }],

    // Defines a standard interface for libraries that want to use compile-time
    // code transformation
    ['babel-plugin-macros'],

    // Enable the class properties proposal
    ['@babel/plugin-proposal-class-properties', { loose: true }],

    // Inlines bindings when possible. Tries to evaluate expressions and prunes
    // unreachable as a result
    ['babel-plugin-minify-dead-code-elimination'],

    // Allows accessing deeply nested properties with the following
    // syntax: `foo?.bar?.baz`
    ['@babel/plugin-proposal-optional-chaining'],

    // Plugin to add a new resolver for your modules when compiling your code
    // using Babel, e.g. a new "root" directory defined by the `alias` setting
    alias ? ['babel-plugin-module-resolver', { root: ['./src'], alias }] : null,

    // If we're building react, remove prop-types as they are only ment for
    // development
    ifAnyDep(['react'])
      ? [
          'babel-plugin-transform-react-remove-prop-types',
          { mode: 'unsafe-wrap' },
        ]
      : null,

    // If we are treeshaking, e.g. using Rollup or Webpack, and are not building
    // a CJS module, rewrite lodash to ES modules so they are treeshakable
    !isCJS && treeshake
      ? [
          'babel-plugin-transform-rename-import',
          { replacements: [{ original: 'lodash', replacement: 'lodash-es' }] },
        ]
      : null,

    // If we are building for the browser, inline process.env variables.
    isUMD ? ['babel-plugin-transform-inline-environment-variables'] : null,

    // If we are *not* treeshaking, e.g. *not* using Rollup or Webpack,
    // transform the module syntax to commonjs
    !treeshake ? ['@babel/plugin-transform-modules-commonjs'] : null,
  ].filter(Boolean),
};

/**
 * Determine current node version
 * @param {{ engines: { node: number }}} options - Options
 * @return {string}
 * @throws
 */
function getNodeVersion({ engines: { node: nodeVersion = '8' } = {} }) {
  const oldestVersion = semver
    .validRange(nodeVersion)
    .replace(/[>=<|]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .sort(semver.compare)[0];
  if (!oldestVersion) {
    throw new Error(
      `Unable to determine the oldest version in the range in your package.json at engines.node: "${nodeVersion}". Please attempt to make it less ambiguous.`,
    );
  }
  return oldestVersion;
}
