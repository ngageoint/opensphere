goog.module('os.data.FeatureEventType');
goog.module.declareLegacyNamespace();

/**
 * Change events fired by ol.Feature objects that avoid OL3 listeners.
 * @enum {string}
 */
exports = {
  COLOR: 'feature:color',
  VALUECHANGE: 'feature:valueChange'
};
