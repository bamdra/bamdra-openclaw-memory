#!/bin/bash
# Fix symlinks in the installed plugin

BASE_DIR="$1"
if [ -z "$BASE_DIR" ]; then
  echo "Usage: $0 <base-directory>"
  exit 1
fi

cd "$BASE_DIR" || exit 1

echo "Fixing symlinks in: $PWD"

PACKAGES="memory-core memory-sqlite memory-cache-memory memory-cache-redis topic-router context-assembler fact-extractor summary-refresher"
PLUGINS="plugins/bamdra-memory-context-engine plugins/bamdra-memory-tools"

for PLUGIN in $PLUGINS; do
  echo -e "\nProcessing: $PLUGIN"
  PLUGIN_NODE_MODULES="$PLUGIN/node_modules/@openclaw-enhanced"
  mkdir -p "$PLUGIN_NODE_MODULES"

  for PKG in $PACKAGES; do
    PKG_DEST="$PLUGIN_NODE_MODULES/$PKG"
    rm -rf "$PKG_DEST"

    # 计算相对路径: 从 plugin/node_modules/@openclaw-enhanced/ 到 packages/<pkg>/
    # 例如: plugins/x/node_modules/@openclaw-enhanced/ -> ../../../../packages/x/
    RELATIVE_PATH="../../../../packages/$PKG"

    ln -sf "$RELATIVE_PATH" "$PKG_DEST"
    echo "  Linked $PKG -> $RELATIVE_PATH"
  done
done

echo -e "\n✅ Symlinks fixed!"
