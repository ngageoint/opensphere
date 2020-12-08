goog.module('plugin.basemap.layer.BaseMap');
goog.module.declareLegacyNamespace();

const alertManager = goog.require('os.alert.AlertManager');
const Tile = goog.require('os.layer.Tile');


goog.require('plugin.basemap.ui.baseMapLayerUIDirective');

/**
 */
class BaseMap extends Tile {
  /**
   * Constructor.
   * @param {olx.layer.TileOptions} options Tile layer options
   */
  constructor(options) {
    super(options);

    // omit base maps from the legend by default
    this.renderLegend = goog.nullFunction;
  }

  /**
   * @inheritDoc
   */
  getLayerUI() {
    return 'basemaplayerui';
  }

  /**
   * @inheritDoc
   */
  setLoading(value) {
    super.setLoading(value);

    if (this.getError() && !BaseMap.warningShown_) {
      alertManager.getInstance().sendAlert('One or more Map Layers are having issues reaching the remote server. Please try ' +
          'adding another Map Layer or [click here to add a working one|basemapAddFailover].',
      os.alert.AlertEventSeverity.WARNING);
      BaseMap.warningShown_ = true;
    }
  }
}


/**
 * @type {boolean}
 * @private
 */
BaseMap.warningShown_ = false;


exports = BaseMap;
