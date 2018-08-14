goog.provide('plugin.ogc.wms.TileWMSSource');
goog.require('ol.source.TileWMS');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.implements');
goog.require('os.ol.source.ILoadingSource');
goog.require('os.source.IFilterableTileSource');
goog.require('os.source.IStyle');
goog.require('os.tile.ColorableTile');



/**
 * Layer source for tile data from WMS servers. This source fires a property change event when its
 * loading state changes based on how many tiles are currently in a loading state.
 * @param {olx.source.TileWMSOptions=} opt_options Tile WMS options.
 * @implements {os.ol.source.ILoadingSource}
 * @implements {os.source.IStyle}
 * @extends {ol.source.TileWMS}
 * @constructor
 */
plugin.ogc.wms.TileWMSSource = function(opt_options) {
  plugin.ogc.wms.TileWMSSource.base(this, 'constructor', opt_options);
  this.refreshEnabled = true;
};
goog.inherits(plugin.ogc.wms.TileWMSSource, ol.source.TileWMS);
os.implements(plugin.ogc.wms.TileWMSSource, os.source.IStyle.ID);


/**
 * @return {?(string|osx.ogc.TileStyle)}
 * @override
 */
plugin.ogc.wms.TileWMSSource.prototype.getStyle = function() {
  var params = this.getParams();

  if (params) {
    var style = params['STYLES'] || '';
  }

  return style;
};


/**
 * @param {?(string|osx.ogc.TileStyle)} value
 * @override
 */
plugin.ogc.wms.TileWMSSource.prototype.setStyle = function(value) {
  var style = typeof value == 'string' ? value : value != null ? value.data : '';

  if (style != this.getStyle()) {
    var params = this.getParams();
    params['STYLES'] = style;

    // clear the tile cache or tiles from the old style may be temporarily displayed while the new tiles are loaded
    this.tileCache.clear();

    // update params, which will trigger a tile refresh
    this.updateParams(params);

    this.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.STYLE));
  }
};
