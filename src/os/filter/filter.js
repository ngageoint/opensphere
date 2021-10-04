goog.declareModuleId('os.filter');

const {default: FeatureTypeColumn} = goog.requireType('os.ogc.FeatureTypeColumn');


/**
 * @typedef {function(...)}
 */
export let FilterLauncherFn;

/**
 * @typedef {function(...):?Array<FeatureTypeColumn>}
 */
export let FilterColumnsFn;
