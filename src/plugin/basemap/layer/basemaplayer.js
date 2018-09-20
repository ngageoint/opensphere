goog.provide('plugin.basemap.layer.BaseMap');

goog.require('os.layer.Tile');
goog.require('plugin.basemap.ui.baseMapLayerUIDirective');



/**
 * @extends {os.layer.Tile}
 * @param {olx.layer.TileOptions} options Tile layer options
 * @constructor
 */
plugin.basemap.layer.BaseMap = function(options) {
  plugin.basemap.layer.BaseMap.base(this, 'constructor', options);

  // omit base maps from the legend by default
  this.renderLegend = goog.nullFunction;
};
goog.inherits(plugin.basemap.layer.BaseMap, os.layer.Tile);


/**
 * @inheritDoc
 */
plugin.basemap.layer.BaseMap.prototype.getLayerUI = function() {
  return 'basemaplayerui';
};


/**
 * @type {boolean}
 * @private
 */
plugin.basemap.layer.BaseMap.warningShown_ = false;


/**
 * @inheritDoc
 */
plugin.basemap.layer.BaseMap.prototype.setLoading = function(value) {
  plugin.basemap.layer.BaseMap.base(this, 'setLoading', value);

  if (this.getError() && !plugin.basemap.layer.BaseMap.warningShown_) {
    os.alertManager.sendAlert('One or more Map Layers are having issues reaching the remote server. Please try ' +
        'adding another Map Layer or [click here to add a working one|basemapAddFailover].',
        os.alert.AlertEventSeverity.WARNING);
    plugin.basemap.layer.BaseMap.warningShown_ = true;
  }
};
