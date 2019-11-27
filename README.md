# jvdx

CLI toolbox for common scripts and tasks for JS/TS projects.
This toolbox is heavily inspired by `kcd-scripts` and `tsdx`.

## Table of Content

- [Requirements](#requirements)
- [Install](#install)
- [Usage](#usage)
- [Available commands](#available-commands)
  - [setup](#setup)
  - [build rollup](#build-rollup)
  - [build babel](#build-babel)
  - [lint](#lint)
  - [format](#format)
  - [test](#test)
  - [clean](#clean)
  - [pre-commit](#pre-commit)

## Requirements

- [Node v10+](node+npm)
- [npm v6+](node+npm)

## Install

Install the module as a dev-dependency via npm.

```text
$ npm install --save-dev jvdx
```

## Usage

```text
$ jvdx <command> [options]
```

For more info, run any command with the `--help` flag.

```text
$ jvdx setup --help
$ jvdx build rollup --help
```

To make your current project jvdx ready, simply run the setup command with
npx. If you want to scaffold a typescript project, append the `--ts` flag.

```text
$ npx jvdx setup
```

## Configuration

**jvdx** allows you to specify your own configuration for most of all used tools
under the hood. The way it works depends on the configuration target, but
basically you just add the configuration as you would normally do and **jvdx**
will use that instead of its built-in one.

In addition, **jvdx** exposes it's configuration under `jvdx/dist/configs/` so
you can use it and override/extend only the parts of the config you need to.

One benefit is that editor integration works very well for tools like ESLint
which require a project-based ESLint configuration to be present to work.

**.eslintrc.js**

```js
module.exports = {
  extends: ['./node_modules/jvdx/dist/configs/eslintrc'],
};
```

**.prettierrc.js**

```js
module.exports = {
  ...require('./node_modules/jvdx/dist/configs/prettierrc'),
};
```

**.babelrc**

```json
{
  "presets": ["./node_modules/jvdx/dist/configs/babelrc"]
}
```

**jest.config.js**

```js
const {
  jest: jestConfig,
} = require('./node_modules/jvdx/dist/configs/jest.config');
module.exports = Object.assign(jestConfig, {
  // your overrides here
});
```

> Please keep in mind: We don't merge anything for you to make it less magical
> and more straightforward.

All available commands expose additional options through their CLI `[options]`
flag.

## Available commands

### setup

Scaffold a new jvdx project in your current directory. The command prompts you
to pick a starter template. Available templates are: `Basic`, `React` and `None`.

Use the `Basic` template for a simple Node.js package.  
If you want to scaffold a React component library, use the `React` template.  
Pick `None` if you just want to enhance your current project with **jvdx**.

**Usage**

`$ jvdx setup [options]`

**Options**

- `-h, --help`  
  Displays help message

**Examples**

```text
$ jvdx setup
```

### build rollup

Build your project using Rollup

**Usage**

`$ jvdx build rollup <input> [options]`

**Options**

- `--config`  
  Config file to use (defaults to built-in config or rollup.config.js)

- `-w, --watch`  
  Watch files in bundle and rebuild on changes

- `-d, --dir`  
  The directory in which all compiled chunks are placed (default dist)

- `-f, --format`  
  Comma separated list of output types (e.g. amd, cjs, esm, iife, umd) (default esm,cjs,umd,umd.min)

- `-e, --environment`  
  Settings passed to rollup.config.js file (format: KEY:value,ANOTHER_KEY:value)

- `-c, --clean`  
  Clear output directory

- `-h, --help`  
  Displays help message

**Examples**

```text
$ jvdx build rollup "src/index.ts"
$ jvdx build rollup <input> --config <filename>
$ jvdx build rollup <input> --watch
$ jvdx build rollup <input> --dir <dirname>
$ jvdx build rollup <input> --format <format>
$ jvdx build rollup <input> --environment <values>
$ jvdx build rollup <input> --clear
```

### build babel

Build your project using Babel

**Usage**

`$ jvdx build babel [input] [options]`

**Options**

- `-d, --out-dir`  
  The directory in which all compiled chunks are placed (default dist)

- `--ignore`  
  List of paths to exclude from processing
  (default: `**/node_modules/**,**/__tests__/**,**/__mocks__/**`)

- `-c, --clean`  
  Clean output directory

- `-h, --help`  
  Displays help message

**Examples**

```text
$ jvdx build babel "src/**/*"
$ jvdx build babel [input] --out-dir <dirname>
$ jvdx build babel [input] --ignore <list>
$ jvdx build babel [input] --clean
```

### lint

Lint your source code with ESlint and Prettier

**Usage**

`$ jvdx lint [options]`

**Options**

- `--config`  
  Config file to use (defaults to built-in config or `.eslintrc.js`)

- `--ignore-path`  
  Specify path to custom eslintignore file

- `--no-cache`  
  Disable ESlint cache

- `--ext`  
  Specify which file extensions ESLint will process
  (default: `.js,.jsx,.ts,.tsx`)

- `-h, --help`  
  Displays help message

**Examples**

```text
$ jvdx lint
$ jvdx lint --config <filename>
$ jvdx lint --ignore-path <filename>
$ jvdx lint --no-cache
$ jvdx lint --ext <list>
```

### format

Format your source code via Prettier

**Usage**

`$ jvdx format [options]`

**Options**

- `--config`  
  Config file to use (defaults to built-in config or `.prettierrc.js`)

- `--ignore-path`  
  Specify path to custom prettierignore file

- `--no-write`  
  Disable rewriting all processed files in place

- `-h, --help`  
  Displays help message

**Examples**

```text
$ jvdx format
$ jvdx format --config <filename>
$ jvdx format --ignore-path <filename>
$ jvdx format --no-write
```

### test

Runs your tests using Jest

**Usage**

`$ jvdx test [options]`

**Options**

- `-w, --watch`  
  Run Jest in watch mode

- `-h, --help`  
  Displays help message

**Examples**

```text
$ jvdx test
$ jvdx test --watch
```

### clean

Clean project by removing node modules and npm/yarn lock files.
You can append a glob pattern to remove additional files/folders.

**Usage**

`$ jvdx clean [options]`

**Options**

- `-h, --help`  
  Displays help message

**Examples**

```text
$ jvdx clean
$ jvdx clean <glob>
```

### pre-commit

Run pre-commit tasks with lint-staged

**Usage**

`$ jvdx pre-commit [options]`

**Options**

- `--config`  
  Config to use (defaults to built-in config or `lint-staged` object in
  `package.json`)

- `-h, --help`  
  Displays help message

**Examples**

```text
$ jvdx pre-commit
$ jvdx pre-commit --config <filename>
```

---

_Author:_ Joel Voß (<mail@joelvoss.com>)  
_License:_ [MIT](#LICENSE)

<!-- Sources -->

[node+npm]: https://nodejs.org
