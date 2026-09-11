#!/bin/sh
# Convenience entrypoint for this workspace when Node is supplied by Codex.
set -eu
cd "$(dirname "$0")/.."
if command -v node >/dev/null 2>&1; then
  test_node=$(command -v node)
else
  test_node="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
fi
if [ ! -x "$test_node" ]; then
  echo 'Node.js 22+ is required. Install Node, then npm install.' >&2
  exit 1
fi
if [ ! -f node_modules/playwright/cli.js ]; then
  echo 'Run npm install and npm run test:install first.' >&2
  exit 1
fi
if [ -d .cache/ms-playwright/chromium-1234 ]; then
  export PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright"
fi
"$test_node" tests/extension.test.mjs
"$test_node" tests/player.test.mjs
exec "$test_node" node_modules/playwright/cli.js test "$@"
