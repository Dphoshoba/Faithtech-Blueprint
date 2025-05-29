#!/bin/bash

# Install ESLint and core dependencies
npm install --save-dev \
  eslint \
  @typescript-eslint/parser \
  @typescript-eslint/eslint-plugin \
  prettier \
  eslint-config-prettier \
  eslint-plugin-prettier

# Install React-specific plugins
npm install --save-dev \
  eslint-plugin-react \
  eslint-plugin-react-hooks \
  eslint-plugin-jsx-a11y

# Install security and code quality plugins
npm install --save-dev \
  eslint-plugin-sonarjs \
  eslint-plugin-security \
  eslint-plugin-import

# Install TypeScript and types
npm install --save-dev \
  typescript \
  @types/react \
  @types/node

# Make script executable
chmod +x scripts/setup-eslint.sh

echo "ESLint dependencies installed successfully!" 