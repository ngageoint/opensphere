goog.provide('plugin.basemap.TerrainDescriptor');
goog.require('os.data.BaseDescriptor');
goog.require('plugin.basemap');



/**
 * Placeholder descriptor to point users at the new terrain control location.
 * @extends {os.data.BaseDescriptor}
 * @constructor
 */
plugin.basemap.TerrainDescriptor = function() {
  plugin.basemap.TerrainDescriptor.base(this, 'constructor');
  this.setDescription(plugin.basemap.TerrainDescriptor.DESCRIPTION);
  this.setProvider(null);
  this.setTags(['GEOINT', 'Terrain', 'Elevation']);
  this.setTitle('Terrain');
  this.setType(null);
  this.descriptorType = plugin.basemap.TERRAIN_ID;

  /**
   * If the alert has been displayed.
   * @type {boolean}
   * @private
   */
  this.alertDisplayed_ = false;
};
goog.inherits(plugin.basemap.TerrainDescriptor, os.data.BaseDescriptor);


/**
 * Tell the user what happened to terrain.
 * @type {string}
 * @const
 */
plugin.basemap.TerrainDescriptor.DESCRIPTION = 'Terrain is no longer managed from the Add Data window. It can now ' +
    'be toggled by right-clicking the map, or in the Map Display section of Settings.';


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


/**
 * @inheritDoc
 */
plugin.basemap.TerrainDescriptor.prototype.getLastActive = function() {
  // don't remember last active
  return NaN;
};


/**
 * @inheritDoc
 */
plugin.basemap.TerrainDescriptor.prototype.touchLastActive = function() {
  // don't remember last active
};


/**
 * @inheritDoc
 */
plugin.basemap.TerrainDescriptor.prototype.restore = function(from) {
  // don't restore this descriptor
};
