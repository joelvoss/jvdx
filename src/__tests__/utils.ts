jest.mock('read-pkg-up', () => ({
  sync: jest.fn(() => ({
    packageJson: {
      testProp: true,
      dependencies: {
        depProp: true,
      },
      devDependencies: {
        depProp2: true,
      },
      peerDependencies: {
        depProp3: true,
      },
    },
    path: '/test/package.json',
  })),
}));

jest.mock('fs', () => ({
  realpathSync: jest.fn(() => process.cwd()),
  existsSync: jest.fn(path => {
    if (path === '/test/file-exists.txt') {
      return true;
    } else {
      return false;
    }
  }),
}));

jest.mock('cross-spawn');

test(`fromRoot resolves the given path relative to the package root`, () => {
  expect(require('../utils').fromRoot('path/from/root')).toBe(
    '/test/path/from/root',
  );
});

test(`hasFile evaluates if a file exists relative to the package root`, () => {
  expect(require('../utils').hasFile('file-exists.txt')).toBe(true);
  expect(require('../utils').hasFile('file-does-not-exists.txt')).toBe(false);
});

test(`hasPkgProp evaluates if a given package.json prop exists`, () => {
  expect(require('../utils').hasPkgProp('testProp')).toBe(true);
  expect(require('../utils').hasPkgProp('notThere')).toBe(false);
});

test(`hasPkgSubProp evaluates if a given package.json subprop exists`, () => {
  expect(require('../utils').hasPkgSubProp('dependencies')('depProp')).toBe(
    true,
  );
  expect(require('../utils').hasPkgSubProp('dependencies')('notThere')).toBe(
    false,
  );
});

test(`hasDep, hasDevDep, hasPeerDep and hasAnyDep evaluate if pre-defined subprops exist`, () => {
  expect(require('../utils').hasDep('depProp')).toBe(true);
  expect(require('../utils').hasDevDep('depProp2')).toBe(true);
  expect(require('../utils').hasPeerDep('depProp3')).toBe(true);
  expect(require('../utils').hasAnyDep('depProp3')).toBe(true);
});

test(`ifAnyDep returns the true argument if true and false argument if false`, () => {
  expect(require('../utils').ifAnyDep('depProp', 'red', 'green')).toEqual(
    'red',
  );
  expect(require('../utils').ifAnyDep('depProp4', 'red', 'green')).toEqual(
    'green',
  );
});

test(`removePkgScope removes the scope prefix from a package name`, () => {
  expect(require('../utils').removePkgScope('@joelvoss/jvdx')).toBe('jvdx');
});

test(`parseArgs parses a sade-cli options object`, () => {
  const opts = { _: [], a: 'a', b: true, c: 'test' };
  expect(require('../utils').parseArgs(opts, ['a'])).toEqual([
    '--b',
    '--c',
    'test',
  ]);
});

test('parseEnv parses the existing environment variable', () => {
  const globals = { react: 'React', 'prop-types': 'PropTypes' };
  process.env.BUILD_GLOBALS = JSON.stringify(globals);
  expect(require('../utils').parseEnv('BUILD_GLOBALS')).toEqual(globals);
  delete process.env.BUILD_GLOBALS;
});

test('asyncMap awaits all mapped iterator functions', () => {
  const array = [1, 2, 3];
  const mapper = async (v: any, i: number) => {
    await new Promise(resolve => setTimeout(() => resolve(), 100));
    return v + i;
  };
  expect(require('../utils').asyncMap(array, mapper)).resolves.toBe([1, 3, 5]);
});

test(`getWatchInclude parses a rollup watch input into a include glob pattern`, () => {
  expect(
    require('../utils').getWatchInclude('deeply/nested/index.ts'),
  ).toEqual(['deeply/nested/**']);
});

test(`yarnOrNpm returns yarn if it's installed, npm if not`, () => {
  const spawn = require('cross-spawn');
  spawn.sync.mockImplementationOnce(() => ({ status: 0 }));
  expect(require('../utils').yarnOrNpm()).toEqual({
    args: ['add'],
    cmd: 'yarn',
  });

  spawn.sync.mockImplementationOnce(() => ({ status: 1 }));
  expect(require('../utils').yarnOrNpm()).toEqual({
    args: ['install'],
    cmd: 'npm',
  });
});
