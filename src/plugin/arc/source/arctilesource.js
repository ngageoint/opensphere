goog.declareModuleId('plugin.arc.source.ArcTileSource');

import TileArcGISRest from 'ol/src/source/TileArcGISRest.js';

/**
 * Extension of the base OL3 Arc tile source. This implements ILoadingSource so that we have a loading spinner
 * in the layers window.
 *
 * @implements {ILoadingSource}
 */
class ArcTileSource extends TileArcGISRest {
  /**
   * Constructor.
   * @param {olx.source.TileArcGISRestOptions=} opt_options
   */
  constructor(opt_options) {
    super(opt_options);
    this.refreshEnabled = true;
  }

  /**
   * This resets the params key that is used by the renderer to determine whether it needs to fetch a
   * new tile.
   *
   * @private
   */
  resetParamsKey_() {
    var i = 0;
    var res = [];
    var params = this.getParams();
    for (var key in params) {
      res[i++] = key + '-' + params[key];
    }

    this.setKey(res.join('/'));
  }

  /**
   * @inheritDoc
   */
  updateParams(params) {
    this.resetParamsKey_();
    super.updateParams(params);
  }
}

export default ArcTileSource;
