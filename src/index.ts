#!/usr/bin/env node

import sade from 'sade';
import { setup } from './actions/setup';
import { lint } from './actions/lint';
import { format } from './actions/format';
import { preCommit } from './actions/pre-commit';
import { rollup, babel } from './actions/build';
import { clean } from './actions/clean';
import { jest } from './actions/jest';
import { prompt } from 'enquirer';
const pkg = require('../package.json');

const prog = sade(pkg.name);

/**
 * Setup task
 */
prog
  .command('setup')
  .describe('Scaffold a new jvdx project in your current directory')
  .example('setup')
  .action(async (opts: any) => {
    const { template } = (await prompt({
      type: 'select',
      name: 'template',
      message: 'Pick a starter template',
      choices: [
        { name: 'empty', message: 'Config only', value: 'empty' },
        { name: 'javascript', message: 'Javascript', value: 'javascript' },
        { name: 'typescript', message: 'typescript', value: 'typescript' },
        { name: 'react-ts', message: 'React (TS)', value: 'react-ts' },
        { name: 'react-js', message: 'React (JS)', value: 'react-js' },
      ],
    }).catch(() => {
      process.exit(1);
    })) as { template: string };

    const status = await setup(template.toLowerCase(), opts);
    process.exit(status);
  });

/**
 * Build task (rollup)
 */
prog
  .command('build rollup <input>')
  .describe('Build your project using Rollup')
  .example('build rollup "src/index.ts"')
  .option(
    '--config',
    'Config file to use (defaults to built-in config or rollup.config.js)',
  )
  .example('build rollup <input> --config <filename>')
  .option('-w --watch', 'Watch files in bundle and rebuild on changes')
  .example('build rollup <input> --watch')
  .option(
    '-d --dir',
    'The directory in which all compiled chunks are placed',
    'dist',
  )
  .example('build rollup <input> --dir <dirname>')
  .option(
    '-f --format',
    'Comma separated list of output types (e.g. amd, cjs, esm, iife, umd)',
    'esm,cjs,umd,umd.min',
  )
  .example('build rollup <input> --format <format>')
  .option(
    '-e --environment',
    'Settings passed to rollup.config.js file (format: KEY:value,ANOTHER_KEY:value)',
  )
  .example('build rollup <input> --environment <values>')
  .option('-c --clean', 'Clear output directory')
  .example('build rollup <input> --clear')
  .action(async (input: string, opts: any) => {
    await rollup(input, opts);
    console.log();
  });

/**
 * Build task (babel)
 */
prog
  .command('build babel [input]')
  .describe('Build your project using Babel')
  .example('build babel "src/**/*"')
  .option(
    '-d --out-dir',
    'The directory in which all compiled chunks are placed',
    'dist',
  )
  .example('build babel [input] --out-dir <dirname>')
  .option(
    '--ignore',
    'List of paths to exclude from processing',
    '**/node_modules/**,**/__mocks__/**,**/__tests__/**,**/__fixtures__/**,**/__coverage__/**',
  )
  .example('build babel [input] --ignore <list>')
  .option(
    '--copy-files',
    'List of paths to exclude from processing and copy into out-dir',
  )
  .example('build babel [input] --copy-files <list>')
  .option('-c --clean', `Clean output directory`)
  .example('build babel [input] --clean')
  .action(async (input: string, opts: any) => {
    const status = await babel(input, opts);
    console.log();
    process.exit(status);
  });

/**
 * Linting task
 */
prog
  .command('lint')
  .describe('Lint your source code with ESlint and Prettier')
  .example('lint')
  .option(
    '--config',
    'Config file to use (defaults to built-in config or .eslintrc.js)',
  )
  .example('lint --config <filename>')
  .option('--ignore-path', 'Specify path to custom eslintignore file')
  .example('lint --ignore-path <filename>')
  .option('--no-cache', 'Disable ESlint cache')
  .example('lint --no-cache')
  .option(
    '--ext',
    'Specify which file extensions ESLint will process',
    '.js,.jsx,.ts,.tsx',
  )
  .example('lint --ext <list>')
  .action((opts: any) => {
    const status = lint(opts);
    console.log();
    process.exit(status);
  });

/**
 * Format task
 */
prog
  .command('format')
  .describe('Format your source code via Prettier')
  .example('format')
  .option(
    '--config',
    'Config file to use (defaults to built-in config or .prettierrc.js)',
  )
  .example('format --config <filename>')
  .option('--ignore-path', 'Specify path to custom prettierignore file')
  .example('format --ignore-path <filename>')
  .option('--no-write', 'Disable rewriting all processed files in place')
  .example('format --no-write')
  .action((opts: any) => {
    const status = format(opts);
    console.log();
    process.exit(status);
  });

/**
 * Test task
 */
prog
  .command('test')
  .describe('Runs your tests using Jest')
  .example('test')
  .option('-w --watch', 'Run Jest in watch mode')
  .example('test --watch')
  .action(async (opts: any) => {
    await jest(opts);
    console.log();
    process.exit(0);
  });

/**
 * Clean task
 */
prog
  .command('clean')
  .describe(
    'Clean project by removing node modules and npm/yarn lock files. You can append a glob pattern to remove additional files/folders.',
  )
  .example('clean')
  .example('clean <glob>')
  .action((opts: any) => {
    const status = clean(opts);
    console.log();
    process.exit(status);
  });

/**
 * Pre-commit task
 */
prog
  .command('pre-commit')
  .describe('Run pre-commit tasks with lint-staged')
  .example('pre-commit')
  .option(
    '--config',
    'Config to use (defaults to built-in config or lint-staged object in package.json)',
  )
  .example('pre-commit --config <filename>')
  .action((opts: any) => {
    const status = preCommit(opts);
    process.exit(status);
  });

prog.parse(process.argv);
