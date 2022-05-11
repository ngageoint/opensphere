goog.declareModuleId('plugin.ogc.wms.TileWMSSource');

import TileWMS from 'ol/src/source/TileWMS.js';

import PropertyChangeEvent from '../../../os/events/propertychangeevent.js';
import osImplements from '../../../os/implements.js';
import IStyle from '../../../os/source/istylesource.js';
import PropertyChange from '../../../os/source/propertychange.js';

/**
 * Layer source for tile data from WMS servers. This source fires a property change event when its
 * loading state changes based on how many tiles are currently in a loading state.
 *
 * @implements {ILoadingSource}
 * @implements {IStyle}
 */
export default class TileWMSSource extends TileWMS {
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
   * Gets the extent.
   * @return {*} The extent
   */
  getExtent() {
    return this.getProjection().getExtent();
  }

  /**
   * The extent.
   * @param {*} extent The extent to set.
   */
  setExtent(extent) {
    this.getProjection().setExtent(extent);
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

      this.dispatchEvent(new PropertyChangeEvent(PropertyChange.STYLE));
    }
  }
}

osImplements(TileWMSSource, IStyle.ID);
