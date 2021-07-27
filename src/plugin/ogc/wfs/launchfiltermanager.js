goog.module('plugin.ogc.wfs.launchFilterManager');
goog.module.declareLegacyNamespace();

const {launchForLayer} = goog.require('os.ui.query.CombinatorUI');

const Vector = goog.requireType('os.layer.Vector');


/**
 * Launch the filter manager
 *
 * @param {!Vector} layer The layer
 */
exports = function(layer) {
  launchForLayer(layer.getId());
};
