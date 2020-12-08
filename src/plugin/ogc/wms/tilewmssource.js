goog.module('plugin.ogc.wms.TileWMSSource');
goog.module.declareLegacyNamespace();

goog.require('os.source.IFilterableTileSource');
goog.require('os.tile.ColorableTile');

const TileWMS = goog.require('ol.source.TileWMS');
const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');
const osImplements = goog.require('os.implements');
const IStyle = goog.require('os.source.IStyle');
const ILoadingSource = goog.requireType('os.ol.source.ILoadingSource');



/**
 * Layer source for tile data from WMS servers. This source fires a property change event when its
 * loading state changes based on how many tiles are currently in a loading state.
 *
 * @implements {ILoadingSource}
 * @implements {IStyle}
 */
class TileWMSSource extends TileWMS {
  /**
   * Constructor.
   * @param {olx.source.TileWMSOptions=} opt_options Tile WMS options.
   */
  constructor(opt_options) {
    super(opt_options);
    this.refreshEnabled = true;
  }

  /**
   * @return {?(string|osx.ogc.TileStyle)}
   * @override
   */
  getStyle() {
    var params = this.getParams();

    if (params) {
      var style = params['STYLES'] || '';
    }

    return style;
  }

  /**
   * @param {?(string|osx.ogc.TileStyle)} value
   * @override
   */
  setStyle(value) {
    var style = typeof value == 'string' ? value : value != null ? value.data : '';

    if (style != this.getStyle()) {
      var params = this.getParams();
      params['STYLES'] = style;

      // clear the tile cache or tiles from the old style may be temporarily displayed while the new tiles are loaded
      this.tileCache.clear();

      // update params, which will trigger a tile refresh
      this.updateParams(params);

      this.dispatchEvent(new PropertyChangeEvent(os.source.PropertyChange.STYLE));
    }
  }
}

osImplements(TileWMSSource, IStyle.ID);


exports = TileWMSSource;
