#!/bin/zsh
cd "$(dirname "$0")" || exit 1
if [[ -x "$PWD/.tools/node/bin/node" ]]; then
  export PATH="$PWD/.tools/node/bin:$PATH"
fi
if ! command -v node >/dev/null; then
  print 'Install Node.js 22 LTS or newer, then open this file again.'
  read '?Press Enter to close.'
  exit 1
fi
if [[ ! -d node_modules ]]; then
  npm install || exit 1
fi
print 'Portfolio: http://127.0.0.1:5173'
print 'Content editor: http://127.0.0.1:5173/edit'
exec npm run dev
