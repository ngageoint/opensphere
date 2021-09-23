goog.declareModuleId('plugin.basemap.layer.BaseMap');

const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const AlertManager = goog.require('os.alert.AlertManager');
const fn = goog.require('os.fn');
const Tile = goog.require('os.layer.Tile');
const {directiveTag: basemapLayerUi} = goog.require('plugin.basemap.ui.BaseMapLayerUI');


/**
 * @type {boolean}
 */
let warningShown = false;


/**
 */
export default class BaseMap extends Tile {
  /**
   * Constructor.
   * @param {olx.layer.TileOptions} options Tile layer options
   */
  constructor(options) {
    super(options);

    // omit base maps from the legend by default
    this.renderLegend = fn.noop;
  }

  /**
   * @inheritDoc
   */
  getLayerUI() {
    return basemapLayerUi;
  }

  /**
   * @inheritDoc
   */
  setLoading(value) {
    super.setLoading(value);

    if (this.getError() && !warningShown) {
      AlertManager.getInstance().sendAlert(
          'One or more Map Layers are having issues reaching the remote server. Please try adding another Map Layer ' +
          'or [click here to add a working one|basemapAddFailover].',
          AlertEventSeverity.WARNING);
      warningShown = true;
    }
  }
}
