#!/bin/sh
# Use the installed runtime, or the desktop runtime available in this workspace.
set -eu
cd "$(dirname "$0")/.."
if ! command -v node >/dev/null 2>&1; then
  export PATH="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH"
fi
if ! command -v npm >/dev/null 2>&1 && [ -f .cache/ci-lock/npm/package/bin/npm ]; then
  mkdir -p .cache/design-bin
  cat > .cache/design-bin/npm <<'EOF'
#!/bin/sh
exec node "$(dirname "$0")/../ci-lock/npm/package/bin/npm-cli.js" "$@"
EOF
  chmod +x .cache/design-bin/npm
  export PATH="$PWD/.cache/design-bin:$PATH"
fi
if [ -d .cache/ms-playwright/chromium-1234 ]; then
  export PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright"
fi
if ! command -v npm >/dev/null 2>&1; then
  echo 'Node.js 22+ and npm are required. Install them, then run npm ci.' >&2
  exit 1
fi
exec npm run "${1:-storybook}"
