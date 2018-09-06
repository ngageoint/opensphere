goog.provide('plugin.basemap.TerrainDescriptor');
goog.require('os.config.DisplaySetting');
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
   * Flag to prevent handling settings events triggered by this descriptor.
   * @type {boolean}
   * @private
   */
  this.ignoreSettingsEvents_ = false;

  os.settings.listen(os.config.DisplaySetting.ENABLE_TERRAIN, this.onTerrainChange_, false, this);
};
goog.inherits(plugin.basemap.TerrainDescriptor, os.data.BaseDescriptor);


/**
 * Tell the user what happened to terrain.
 * @type {string}
 * @const
 */
plugin.basemap.TerrainDescriptor.DESCRIPTION = 'Show terrain on the 3D globe.';


/**
 * Clean up.
 */
plugin.basemap.TerrainDescriptor.prototype.disposeInternal = function() {
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
  this.ignoreSettingsEvents_ = true;
  os.settings.set(os.config.DisplaySetting.ENABLE_TERRAIN, this.isActive());
  this.ignoreSettingsEvents_ = false;

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
 * @param {os.events.SettingChangeEvent} event
 * @private
 */
plugin.basemap.TerrainDescriptor.prototype.onTerrainChange_ = function(event) {
  if (!this.ignoreSettingsEvents_ && event.newVal !== this.isActive()) {
    this.setActive(/** @type {boolean} */ (event.newVal));
  }
};
