#!/bin/bash
PATH=./node_modules/.bin:$PATH

export NODE_ENV="production"

# //////////////////////////////////////////////////////////////////////////////

# Default task (executed when no <task> argument was given)
function default {
  build
}

function copy {
  copyfiles -u 2 "src/configs/*ignore" "src/configs/tsconfig" "src/configs/Taskfile" "dist/configs"
  copyfiles -a "templates/**/*" "dist/"
  printf "$(now) $(checkmark) Successfully copied files\n"
}

function build {  
  rm -rf dist
  tsc -p tsconfig.json 
  copy
  printf "$(now) $(checkmark) Successfully build package\n"
}

function format {
  node dist/index.js format "${@:1}"
}

function lint {
  node dist/index.js lint "${@:1}"
}

function test {
  node dist/index.js test
}

function validate {
  format "${@:1}"
  lint "${@:1}"
  test
}

function clean {
  node dist/index.js clean dist "${@:1}"
}

# //////////////////////////////////////////////////////////////////////////////

function help {
  printf "$(now) Usage: $0 <task> <args>\n\n"
}

function now {
  time=$(date +'%H:%M:%S')
  printf "\033[2m[$time]\033[0m"
}

function checkmark {
  printf "\033[1m\033[32m✓\033[0m"
}

TASK=${@:-default}

printf "$(now) \033[1m\033[96mTaskfile\033[0m $TASK\n\n"
"${@:-default}"
printf "\n"