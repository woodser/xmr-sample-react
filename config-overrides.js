const webpack = require("webpack");
const fs = require("fs");

fs.mkdirSync("public", { recursive: true });
[
  {
    src: "node_modules/monero-ts/dist/monero.worker.js",
    dest: "public/monero.worker.js",
  }
].forEach(({ src, dest }) => fs.copyFileSync(src, dest))

module.exports = function override(config) {
  const fallback = config.resolve.fallback || {};
  Object.assign(fallback, {
    crypto: false, // require.resolve("crypto-browserify") can be polyfilled here if needed
    stream: require.resolve("stream-browserify"), // require.resolve("stream-browserify") can be polyfilled here if needed
    assert: require.resolve("assert"), // require.resolve("assert") can be polyfilled here if needed
    http: require.resolve("stream-http"), // require.resolve("stream-http") can be polyfilled here if needed
    https: require.resolve("https-browserify"), // require.resolve("https-browserify") can be polyfilled here if needed
    os: false, // require.resolve("os-browserify") can be polyfilled here if needed
    url: false, // require.resolve("url") can be polyfilled here if needed
    zlib: false, // require.resolve("browserify-zlib") can be polyfilled here if needed,
  });
  config.resolve.fallback = fallback;
  config.resolve.alias = {
    ...config.resolve.alias,
    fs: "memfs",
  };
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
    }),
  ]);
  config.ignoreWarnings = [/Failed to parse source map/];
  config.module.rules.push({
    test: /\.(js|mjs|jsx)$/,
    enforce: "pre",
    loader: require.resolve("source-map-loader"),
    resolve: {
      fullySpecified: false,
    },
  });
  const fileLoaderRule = getFileLoaderRule(config.module.rules);
  fileLoaderRule.exclude.push(/\.cjs$/);
  config.externals = {
    ...config.externals,
    child_process: 'child_process'
  };
  return config;
};

function getFileLoaderRule(rules) {
  for(const rule of rules) {
      if("oneOf" in rule) {
          const found = getFileLoaderRule(rule.oneOf);
          if(found) {
              return found;
          }
      } else if(rule.test === undefined && rule.type === 'asset/resource') {
          return rule;
      }
  }
}