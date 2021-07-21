goog.module('os.proj.switch.BinnedLayersType');
goog.module.declareLegacyNamespace();

/**
 * @typedef {{
 *  remove: Array<Object<string, *>>,
 *  unknown: Array<Object<string, *>>,
 *  add: Array<Object<string, *>>,
 *  reconfig: Array<Object<string, *>>
 * }}
 */
let BinnedLayersType;

exports = BinnedLayersType;
