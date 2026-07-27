const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Force tslib's CJS build (its ESM `module`/`exports["import"]` build lacks a
// `.default` export, which Metro's web bundling picks up otherwise and
// breaks any transpiled dependency doing `tslib.default.__extends` — hit via
// moti -> framer-motion -> popmotion -> tslib on web). extraNodeModules
// alone isn't enough here (Metro still resolves tslib's `exports` map for
// some import call sites), so intercept it directly in resolveRequest.
const tslibCjsPath = require.resolve('tslib/tslib.js');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('node:')) {
    return { type: 'empty' };
  }
  if (moduleName === 'tslib') {
    return { type: 'sourceFile', filePath: tslibCjsPath };
  }
  return context.resolveRequest(context, moduleName, platform);
};

config.resolver.unstable_enablePackageExports = false;

module.exports = config;


