goog.provide('plugin.arc.source.ArcTileSource');
goog.require('ol.source.TileArcGISRest');
goog.require('os.ol.source.ILoadingSource');
goog.require('os.source.IFilterableTileSource');
goog.require('os.tile.ColorableTile');



/**
 * Extension of the base OL3 Arc tile source. This implements ILoadingSource so that we have a loading spinner
 * in the layers window.
 * @param {olx.source.TileArcGISRestOptions=} opt_options
 * @implements {os.ol.source.ILoadingSource}
 * @extends {ol.source.TileArcGISRest}
 * @constructor
 */
plugin.arc.source.ArcTileSource = function(opt_options) {
  plugin.arc.source.ArcTileSource.base(this, 'constructor', opt_options);
  this.refreshEnabled = true;
};
goog.inherits(plugin.arc.source.ArcTileSource, ol.source.TileArcGISRest);


/**
 * This resets the params key that is used by the renderer to determine whether it needs to fetch a
 * new tile.
 * @private
 */
plugin.arc.source.ArcTileSource.prototype.resetParamsKey_ = function() {
  var i = 0;
  var res = [];
  var params = this.getParams();
  for (var key in params) {
    res[i++] = key + '-' + params[key];
  }

  this.setKey(res.join('/'));
};


/**
 * @inheritDoc
 */
plugin.arc.source.ArcTileSource.prototype.updateParams = function(params) {
  this.resetParamsKey_();
  plugin.arc.source.ArcTileSource.base(this, 'updateParams', params);
};
