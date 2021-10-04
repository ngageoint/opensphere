goog.declareModuleId('os.data.FeatureEventType');

/**
 * Change events fired by ol.Feature objects that avoid OL3 listeners.
 * @enum {string}
 */
const FeatureEventType = {
  COLOR: 'feature:color',
  VALUECHANGE: 'feature:valueChange'
};

export default FeatureEventType;
