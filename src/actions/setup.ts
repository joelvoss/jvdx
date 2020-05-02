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
  setupChmodSuccessMsg,
  setupChmodErrorMsg,
  setupHuskyErrorMsg,
  setupHuskySuccessMsg,
  setupInstallDevDepsErrorMsg,
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
      dest: path.resolve(appDir, './.gcloudignore'),
      content: fs.readFileSync(hereRelative('../configs/gcloudignore')),
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
    {
      dest: path.resolve(appDir, './Taskfile.sh'),
      content: fs.readFileSync(hereRelative('../configs/Taskfile')),
    },
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

  // Make Taskfile executable
  const chmod = spawn.sync(
    'chmod',
    ['+x', path.resolve(appDir, './Taskfile.sh')],
    { stdio: 'ignore' },
  );
  if (chmod.status === 0) {
    setupChmodSuccessMsg(path.resolve(appDir, './Taskfile.sh'));
  } else {
    ++errorCount;
    setupChmodErrorMsg(path.resolve(appDir, './Taskfile.sh'));
  }

  // Modify the parent package.json and add all jvdx scripts to it.
  const newPackageJson = {
    ...packageJson,
    version: '0.0.0',
    description: 'Short description of this application',
    author: 'Name Surname <email@address.com>',
    private: true,
    license: `MIT`,
    main: 'dist/cjs/index.cjs.js',
    module: 'dist/esm/index.es.js',
    ...(isTs ? { typings: 'dist/types/index.d.ts' } : {}),
    files: ['dist'],
    scripts: {
      ...packageJson!.scripts,
      start: './Taskfile.sh',
      test: './Taskfile.sh test',
      prepublish: './Taskfile.sh build',
    },
    ...(isReact
      ? { peerDependencies: { react: '>=16.8', 'react-dom': '>=16.8' } }
      : {}),
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

  // Install missing dependencies
  const { cmd, args } = yarnOrNpm();

  const devDep = [
    isTs || (isReact && !hasDep('@types/jest')) ? '@types/jest' : null,
    isTs && !hasDep('typescript') ? 'typescript' : null,
    isReact && !hasDep('react') ? 'react' : null,
    isReact && !hasDep('react-dom') ? 'react-dom' : null,
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
