goog.provide('plugin.basemap.TerrainDescriptor');
goog.require('os.data.BaseDescriptor');
goog.require('plugin.basemap');



/**
 * Provides terrain data in opensphere
 * @extends {os.data.BaseDescriptor}
 * @constructor
 */
plugin.basemap.TerrainDescriptor = function() {
  plugin.basemap.TerrainDescriptor.base(this, 'constructor');

  /**
   * If the alert has been displayed.
   * @type {boolean}
   * @private
   */
  this.alertDisplayed_ = false;

  this.setDescription(plugin.basemap.TerrainDescriptor.DESCRIPTION);
  this.setTags(['GEOINT', 'Terrain', 'Elevation']);
  this.setType(plugin.basemap.LAYER_TYPE);
  this.descriptorType = plugin.basemap.TERRAIN_ID;
};
goog.inherits(plugin.basemap.TerrainDescriptor, os.data.BaseDescriptor);


/**
 * Tell the user what happened to terrain.
 * @type {string}
 * @const
 */
plugin.basemap.TerrainDescriptor.DESCRIPTION = 'Terrain is no longer managed from the Add Data window. It can now ' +
    'be toggled from either right-clicking the map, or in the Map Display section of the Settings window.';


/**
 * @inheritDoc
 */
plugin.basemap.TerrainDescriptor.prototype.getIcons = function() {
  return os.ui.Icons.TERRAIN;
};


/**
 * @inheritDoc
 */
plugin.basemap.TerrainDescriptor.prototype.setActiveInternal = function() {
  if (this.isActive() && !this.alertDisplayed_) {
    os.alertManager.sendAlert(plugin.basemap.TerrainDescriptor.DESCRIPTION, os.alert.AlertEventSeverity.INFO);
    this.alertDisplayed_ = true;
  }

  return plugin.basemap.TerrainDescriptor.base(this, 'setActiveInternal');
};
