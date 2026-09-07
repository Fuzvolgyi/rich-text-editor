#!/bin/bash
set -e

GITHUB_TOKEN="${GITHUB_TOKEN:?Set GITHUB_TOKEN environment variable (ghp_... PAT with write:packages scope)}"

echo "Building library..."
npx ng build

echo "Publishing to GitHub Packages..."
cd dist/rich-text-editor

cat > .npmrc <<EOF
@fuzvolgyi:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
EOF

npm publish

rm -f .npmrc

echo "Published @fuzvolgyi/rich-text-editor successfully!"
