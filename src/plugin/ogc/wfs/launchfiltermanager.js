goog.module('plugin.ogc.wfs.launchFilterManager');
goog.module.declareLegacyNamespace();

/**
 * Launch the filter manager
 *
 * @param {!os.layer.Vector} layer The layer
 */
exports = function(layer) {
  os.ui.query.CombinatorCtrl.launchForLayer(layer.getId());
};
