#!/bin/zsh

sudo chown -R vscode:vscode node_modules
bun install --frozen-lockfile --ignore-scripts
bunx --bun biome migrate --write

# direnv: auto-load .env on cd
if ! grep -q 'direnv hook zsh' ~/.zshrc 2>/dev/null; then
  echo 'eval "$(direnv hook zsh)"' >> ~/.zshrc
fi
