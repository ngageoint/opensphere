goog.declareModuleId('plugin.ogc.wfs.launchFilterManager');

const {launchForLayer} = goog.require('os.ui.query.CombinatorUI');

const Vector = goog.requireType('os.layer.Vector');

/**
 * Launch the filter manager
 *
 * @param {!Vector} layer The layer
 */
const launchFilterManager = function(layer) {
  launchForLayer(layer.getId());
};

export default launchFilterManager;
