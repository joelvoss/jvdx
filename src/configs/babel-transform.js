const babelJest = require('babel-jest');

// requireUncached requires modules without cache hits
const requireUncached = module => {
  delete require.cache[require.resolve(module)];
  return require(module);
};

module.exports = babelJest.createTransformer({
  ...requireUncached('./babelrc.js'),
});
