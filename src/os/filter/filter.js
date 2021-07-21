goog.module('os.filter');
goog.module.declareLegacyNamespace();

const FeatureTypeColumn = goog.requireType('os.ogc.FeatureTypeColumn');

/**
 * @typedef {function(...)}
 */
let FilterLauncherFn;

/**
 * @typedef {function(...):?Array<FeatureTypeColumn>}
 */
let FilterColumnsFn;

exports = {
  FilterLauncherFn,
  FilterColumnsFn
};
