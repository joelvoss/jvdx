import chalk from 'chalk';
const pkg = require('../package.json');

function getTimeStamp() {
  const pad = (number: number) => (number < 10 ? '0' + number : number);
  const date = new Date(Date.now());
  const timeStr =
    `${pad(date.getUTCHours())}:` +
    `${pad(date.getUTCMinutes())}:` +
    `${pad(date.getUTCSeconds())}`;
  return chalk.dim(`[${timeStr}]`);
}

export function welcomeMsg(cmd: string) {
  console.log(
    `${getTimeStamp()} ${chalk.bold.cyan('jvdx')} ${cmd} ${chalk.dim(
      `v${pkg.version}`,
    )}`,
  );
  console.log();
}

export function runtimeHelperMsg() {
  console.log(`${getTimeStamp()} ${chalk.bold.black.bgYellow(` WARNING `)}`);
  console.log(
    `${getTimeStamp()}   You should add ${chalk.magenta(
      '@babel/runtime',
    )} as dependency to your package`,
  );
  console.log(
    `${getTimeStamp()}   when building your bundles. It will allow reusing "babel"`,
  );
  console.log(
    `${getTimeStamp()}   helpers from node_modules rather than bundling their copies`,
  );
  console.log(`${getTimeStamp()}   into your files.`);
  console.log();
}

export function rollupBuildSuccessMsg(fileCount: number) {
  console.log(
    `${getTimeStamp()} ${chalk.green(
      '✓',
    )} Successfully compiled ${fileCount} files with Rollup.`,
  );
}

export function rollupChunkSuccessMsg(format: string) {
  console.log(
    `${getTimeStamp()} ${chalk.green(
      '✓',
    )} Successfully compiled ${format} bundle`,
  );
}

export function rollupChunkErrorMsg(format: string, error: any) {
  const description = `${error.message || error}`;
  const message = error.plugin
    ? `(${error.plugin}) ${description}`
    : description;

  console.log(
    `${getTimeStamp()} ${chalk.red('✗')} Error(s) compiling ${format} bundle:`,
  );
  console.log(`${getTimeStamp()}   ${message}`);
  if (error.frame) {
    console.log(`${getTimeStamp()}   ${error.frame}`);
  }
}

export function rollupWatchError(type: string, error: any) {
  const description = `${error.message || error}`;
  const message = error.plugin
    ? `(${error.plugin}) ${description}`
    : description;

  console.log(`${getTimeStamp()} ${chalk.bold.white.bgRed(` ${type} `)}`);
  console.log(`${getTimeStamp()}   ${message}`);
  if (error.frame) {
    console.log(`${getTimeStamp()}   ${error.frame}`);
  }
  console.log();
}

export function rollupWatchMsg() {
  console.log(
    `${getTimeStamp()} Watching for changes... ${chalk.dim(
      '(ctrl+c to exit)',
    )}`,
  );
  console.log();
}

export function babelGlobErrorMsg(pattern: string) {
  console.log(`${getTimeStamp()} ${chalk.bold.black.bgYellow(` WARNING `)}`);
  console.log(
    `${getTimeStamp()}   "${chalk.magenta(pattern)}" does not match any files.`,
  );
  console.log(
    `${getTimeStamp()}   Try checking your glob with https://globster.xyz/`,
  );
  console.log();
}

export function babelWriteChunkMsg(dest: string) {
  console.log(`${getTimeStamp()} ${chalk.green('✓')} Created ${dest}`);
}

export function babelBuildSuccessMsg(fileCount: number) {
  console.log();
  console.log(
    `${getTimeStamp()} ${chalk.green(
      '✓',
    )} Successfully compiled ${fileCount} file(s) with Babel`,
  );
}

export function babelBuildErrorMsg(error: any) {
  const description = `${error.message || error}`;

  console.log(`${getTimeStamp()} ${chalk.bold.white.bgRed(` ERROR `)}`);
  console.log(`${getTimeStamp()}   ${description}`);
  error.frame && console.log(`${getTimeStamp()}   ${error.frame}`);
}

export function cleanSuccessMsg(files: string[]) {
  files.forEach(f =>
    console.log(`${getTimeStamp()} ${chalk.green('✓')} Removed ${f}`),
  );
  console.log();
  console.log(
    `${getTimeStamp()} ${chalk.green(
      '✓',
    )} Successfully cleaned working directory`,
  );
}

export function cleanErrorMsg() {
  console.log();
  console.log(
    `${getTimeStamp()} ${chalk.red(
      '✗',
    )} Error(s) while cleaning the working directory`,
  );
}

export function generateTypeDefSuccessMsg() {
  console.log(
    `${getTimeStamp()} ${chalk.green(
      '✓',
    )} Successfully generated type definitions`,
  );
}
export function generateTypeDefErrorMsg() {
  console.log(
    `${getTimeStamp()} ${chalk.red(
      '✗',
    )} Error(s) while generating type definitions`,
  );
}

export function formatSuccessMsg() {
  console.log(
    `${getTimeStamp()} ${chalk.green('✓')} Successfully formatted sources`,
  );
}

export function formatErrorMsg() {
  console.log(
    `${getTimeStamp()} ${chalk.red('✗')} Error(s) while formatting sources`,
  );
}

export function typeCheckSuccessMsg() {
  console.log(
    `${getTimeStamp()} ${chalk.green('✓')} Successfully type-checked sources`,
  );
}
export function typeCheckErrorMsg() {
  console.log(
    `${getTimeStamp()} ${chalk.red('✗')} Error(s) while type-checking sources`,
  );
}

export function lintSuccessMsg() {
  console.log(
    `${getTimeStamp()} ${chalk.green('✓')} Successfully linted sources`,
  );
}
export function lintErrorMsg() {
  console.log(
    `${getTimeStamp()} ${chalk.red('✗')} Error(s) while linting sources`,
  );
}

export function validateSuccessMsg() {
  console.log();
  console.log(
    `${getTimeStamp()} ${chalk.green('✓')} Successfully validated sources`,
  );
}
export function validateErrorMsg() {
  console.log();
  console.log(
    `${getTimeStamp()} ${chalk.red('✗')} Error(s) while validating sources`,
  );
}

export function setupTemplateSuccessMsg(template: string) {
  console.log(
    `${getTimeStamp()} ${chalk.green(
      '✓',
    )} Successfully scaffolded a ${template} project example for you`,
  );
}
export function setupTemplateErrorMsg(template: string) {
  console.log(
    `${getTimeStamp()} ${chalk.red(
      '✗',
    )} Error scaffolding a ${template} project`,
  );
}

export function setupFilesSuccessMsg(path: string) {
  console.log(`${getTimeStamp()} ${chalk.green('✓')} Created ${path}`);
}
export function setupFilesErrorMsg(path: string, err: string) {
  console.log(
    `${getTimeStamp()} ${chalk.red('✗')} Error setting up ${path}: ${err}`,
  );
}

export function setupUpdateJsonSuccessMsg(path: string) {
  console.log(`${getTimeStamp()} ${chalk.green('✓')} Updated ${path}`);
}
export function setupUpdateJsonErrorMsg(path: string, err: string) {
  console.log(
    `${getTimeStamp()} ${chalk.red('✗')} Error updating ${path}: ${err}`,
  );
}

export function setupInstallDepsErrorMsg() {
  console.log(
    `${getTimeStamp()} ${chalk.red('✗')} Error installing dependencies`,
  );
}
export function setupInstallDevDepsErrorMsg() {
  console.log(
    `${getTimeStamp()} ${chalk.red('✗')} Error installing devDependencies`,
  );
}

export function setupGitSuccessMsg(dir: string) {
  console.log(
    `${getTimeStamp()} ${chalk.green(
      '✓',
    )} Initialized empty Git repository in ${dir}`,
  );
}
export function setupGitErrorMsg(dir: string) {
  console.log(
    `${getTimeStamp()} ${chalk.red(
      '✗',
    )} Error initializing Git repository in ${dir}`,
  );
}

export function setupHuskySuccessMsg() {
  console.log(
    `${getTimeStamp()} ${chalk.green('✓')} Installed husky commit hooks`,
  );
}
export function setupHuskyErrorMsg() {
  console.log(
    `${getTimeStamp()} ${chalk.red('✗')} Could not install husky commit hooks`,
  );
}

export function setupSuccessMsg() {
  console.log();
  console.log(
    `${getTimeStamp()} ${chalk.green('✓')} Successfully setup project`,
  );
}
export function setupErrorMsg() {
  console.log();
  console.log(`${getTimeStamp()} ✘ Errors while setting up project`);
}

export function setupInfoMsg() {
  console.log();
  console.log(
    `${getTimeStamp()} For more information consult jvdx's README.md located here:`,
  );
  console.log(`${getTimeStamp()} ./node_modules/jvdx/README.md`);
  console.log();
}
