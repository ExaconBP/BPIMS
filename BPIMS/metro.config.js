const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const {
  resolver: { sourceExts, assetExts },
} = defaultConfig;

const customConfig = {
  resolver: {
    assetExts: assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...sourceExts, 'svg'],
  },
};

// Merge defaultConfig with customConfig
const mergedConfig = mergeConfig(defaultConfig, customConfig);

// Wrap the merged config with Reanimated's configuration
module.exports = wrapWithReanimatedMetroConfig(mergedConfig);
