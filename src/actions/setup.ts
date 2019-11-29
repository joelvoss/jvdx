import spawn from 'cross-spawn';
import * as fs from 'fs-extra';
import path from 'path';
import { appDir, packageJson, hasDep, yarnOrNpm } from '../utils';
import {
  welcomeMsg,
  setupInfoMsg,
  setupErrorMsg,
  setupSuccessMsg,
  setupGitErrorMsg,
  setupGitSuccessMsg,
  setupHuskyErrorMsg,
  setupHuskySuccessMsg,
  setupInstallDevDepsErrorMsg,
  setupInstallDepsErrorMsg,
  setupUpdateJsonSuccessMsg,
  setupUpdateJsonErrorMsg,
  setupFilesSuccessMsg,
  setupFilesErrorMsg,
  setupTemplateSuccessMsg,
  setupTemplateErrorMsg,
} from '../messages';

const here = (...p: string[]) => path.join(__dirname, ...p);
const hereRelative = (...p: string[]) => here(...p).replace(process.cwd(), '.');

export async function setup(template: string, opts: any) {
  welcomeMsg('setup');

  let errorCount = 0;
  const isReact = template === 'react';
  const isJs = template === 'javascript';
  const isTs = template === 'typescript';

  // Scaffold the desired template
  if (isReact || isJs || isTs) {
    try {
      await fs.copy(hereRelative(`../templates/${template}`), appDir, {
        overwrite: true,
      });
      setupTemplateSuccessMsg(template);
    } catch (err) {
      ++errorCount;
      setupTemplateErrorMsg(template);
    }
  }

  // Create additional files regardles of the selected template.
  // These files provide the desired IDE integration and typescript settings.
  const files = [
    {
      dest: path.resolve(appDir, './.gitignore'),
      content: fs.readFileSync(hereRelative('../configs/gitignore')),
    },
    {
      dest: path.resolve(appDir, './.prettierrc.js'),
      content: fs.readFileSync(hereRelative('../configs/prettierrc.js')),
    },
    {
      dest: path.resolve(appDir, './.eslintrc.js'),
      content:
        `module.exports = {\n` +
        `  extends: ['./node_modules/jvdx/dist/configs/eslintrc'],\n` +
        `};`,
    },
    isTs || isReact
      ? {
          dest: path.resolve(appDir, './tsconfig.json'),
          content: fs.readFileSync(hereRelative('../configs/tsconfig')),
        }
      : null,
  ].filter(Boolean) as { dest: string; content: Buffer | string }[];

  for (let f of files) {
    try {
      await fs.outputFile(f.dest, f.content);
      setupFilesSuccessMsg(f.dest);
    } catch (err) {
      ++errorCount;
      setupFilesErrorMsg(f.dest, err.message);
    }
  }

  // Modify the parent package.json and add all jvdx scripts to it.
  const newPackageJson = {
    ...packageJson,
    license: `MIT`,
    scripts: {
      ...packageJson!.scripts,
      ...(isReact
        ? { 'build:rollup': `jvdx build rollup 'src/index.tsx'` }
        : {}),
      ...(isTs ? { 'build:rollup': `jvdx build rollup 'src/index.ts'` } : {}),
      ...(isJs ? { 'build:rollup': `jvdx build rollup 'src/index.js'` } : {}),
      ...(isTs || isJs ? { 'build:babel': `jvdx build babel 'src/**/*'` } : {}),
      lint: 'jvdx lint',
      format: 'jvdx format',
      test: 'jvdx test',
      validate: 'npm run format && npm run lint && npm run test',
      clean: 'jvdx clean',
    },
    ...(isReact ? { peerDependencies: { react: '>=16' } } : {}),
    husky: {
      hooks: {
        'pre-commit': 'jvdx pre-commit',
      },
    },
  };
  const destJsonPath = path.resolve(appDir, './package.json');
  try {
    await fs.outputJson(destJsonPath, newPackageJson, { spaces: 2 });
    setupUpdateJsonSuccessMsg(destJsonPath);
  } catch (err) {
    ++errorCount;
    setupUpdateJsonErrorMsg(destJsonPath, err.message);
  }

  // TODO: Install missing dependencies
  const { cmd, args } = yarnOrNpm();

  const dep = [
    isReact && !hasDep('react') ? 'react' : null,
    isReact && !hasDep('react-dom') ? 'react-dom' : null,
  ]
    .filter(Boolean)
    .sort() as string[];

  if (dep.length !== 0) {
    const installDeps = spawn.sync(cmd, [...args, ...dep], {
      stdio: 'inherit',
    });
    if (installDeps.status !== 0) {
      ++errorCount;
      setupInstallDepsErrorMsg();
    }
  }

  const devDep = [
    isTs || (isReact && !hasDep('@types/jest')) ? '@types/jest' : null,
    isTs && !hasDep('typescript') ? 'typescript' : null,
    isReact && !hasDep('@types/react') ? '@types/react' : null,
    isReact && !hasDep('@types/react-dom') ? '@types/react-dom' : null,
  ]
    .filter(Boolean)
    .sort() as string[];
  if (devDep.length !== 0) {
    const installDevDeps = spawn.sync(cmd, [...args, ...devDep, '--dev'], {
      stdio: 'inherit',
    });
    if (installDevDeps.status !== 0) {
      ++errorCount;
      setupInstallDevDepsErrorMsg();
    }
  }

  // Try setting up an empty Git repository
  const git = spawn.sync('git', ['init'], { stdio: 'ignore' });
  if (git.status === 0) {
    setupGitSuccessMsg(appDir);
  } else {
    ++errorCount;
    setupGitErrorMsg(appDir);
  }

  // Try installing husky commit hooks
  const husky = spawn.sync(
    'node',
    ['./node_modules/husky/husky.js', 'install'],
    {
      stdio: 'ignore',
    },
  );
  if (husky.status === 0) {
    setupHuskySuccessMsg();
  } else {
    ++errorCount;
    setupHuskyErrorMsg();
  }

  if (errorCount === 0) {
    setupSuccessMsg();
  } else {
    setupErrorMsg();
  }

  setupInfoMsg();

  return 0 || undefined;
}
