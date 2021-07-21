goog.module('plugin.ogc.wfs.launchFilterManager');
goog.module.declareLegacyNamespace();

const CombinatorCtrl = goog.require('os.ui.query.CombinatorCtrl');


/**
 * Launch the filter manager
 *
 * @param {!os.layer.Vector} layer The layer
 */
exports = function(layer) {
  CombinatorCtrl.launchForLayer(layer.getId());
};
