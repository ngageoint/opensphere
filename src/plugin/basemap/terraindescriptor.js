goog.provide('plugin.basemap.TerrainDescriptor');
goog.require('os.config.DisplaySetting');
goog.require('os.data.BaseDescriptor');
goog.require('plugin.basemap');



/**
 * Descriptor to activate/deactivate terrain from the Add Data window.
 *
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

  os.settings.listen(os.config.DisplaySetting.ENABLE_TERRAIN, this.onTerrainChange_, false, this);
};
goog.inherits(plugin.basemap.TerrainDescriptor, os.data.BaseDescriptor);


/**
 * User-facing description.
 * @type {string}
 * @const
 */
plugin.basemap.TerrainDescriptor.DESCRIPTION = 'Show terrain on the 3D globe.';


/**
 * @inheritDoc
 */
plugin.basemap.TerrainDescriptor.prototype.disposeInternal = function() {
  plugin.basemap.TerrainDescriptor.base(this, 'disposeInternal');
  os.settings.unlisten(os.config.DisplaySetting.ENABLE_TERRAIN, this.onTerrainChange_, false, this);
};


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
  os.settings.set(os.config.DisplaySetting.ENABLE_TERRAIN, this.isActive());

  return plugin.basemap.TerrainDescriptor.base(this, 'setActiveInternal');
};

/**
 * @inheritDoc
 */
plugin.basemap.TerrainDescriptor.prototype.restore = function(from) {
  plugin.basemap.TerrainDescriptor.base(this, 'restore', from);
  this.tempActive = /** @type {boolean} */ (os.settings.get(os.config.DisplaySetting.ENABLE_TERRAIN, false));
  this.updateActiveFromTemp();
};


/**
 * Handle changes to the terrain enabled setting.
 *
 * @param {os.events.SettingChangeEvent} event
 * @private
 */
plugin.basemap.TerrainDescriptor.prototype.onTerrainChange_ = function(event) {
  if (event.newVal !== this.isActive()) {
    this.setActive(/** @type {boolean} */ (event.newVal));
  }
};
