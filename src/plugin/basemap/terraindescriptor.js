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
   * The terrain provider options
   * @type {?osx.olcs.TerrainProviderOptions}
   * @private
   */
  this.terrainOptions_ = null;

  /**
   * The terrain provider type
   * @type {?string}
   * @private
   */
  this.terrainType_ = null;

  this.setTags(['GEOINT', 'Terrain', 'Elevation']);
  this.setType(plugin.basemap.LAYER_TYPE);
  this.descriptorType = plugin.basemap.TERRAIN_ID;
};
goog.inherits(plugin.basemap.TerrainDescriptor, os.data.BaseDescriptor);


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
  plugin.basemap.TerrainDescriptor.base(this, 'setActiveInternal');

  if (this.isActive()) {
    // activate the terrain provider
    // include the descriptor id as an option so we can set the layer id
    this.terrainOptions_['id'] = this.getId();
    os.MapContainer.getInstance().setTerrainProvider(this.terrainType_, this.terrainOptions_);
  } else {
    // reset to the base terrain provider
    os.MapContainer.getInstance().setTerrainProvider(null);
  }

  return true;
};


/**
 * Get the terrain provider options
 * @return {?osx.olcs.TerrainProviderOptions}
 */
plugin.basemap.TerrainDescriptor.prototype.getTerrainOptions = function() {
  return this.terrainOptions_;
};


/**
 * Set the terrain provider options
 * @param {?osx.olcs.TerrainProviderOptions} value
 */
plugin.basemap.TerrainDescriptor.prototype.setTerrainOptions = function(value) {
  this.terrainOptions_ = value;
};


/**
 * Get the terrain provider type
 * @return {?string}
 */
plugin.basemap.TerrainDescriptor.prototype.getTerrainType = function() {
  return this.terrainType_;
};


/**
 * Set the terrain provider type
 * @param {?string} value
 */
plugin.basemap.TerrainDescriptor.prototype.setTerrainType = function(value) {
  this.terrainType_ = value;
};


/**
 * @inheritDoc
 */
plugin.basemap.TerrainDescriptor.prototype.persist = function(opt_obj) {
  if (!opt_obj) {
    opt_obj = {};
  }

  opt_obj['terrainOptions'] = this.getTerrainOptions();
  opt_obj['terrainType'] = this.getTerrainType();

  return plugin.basemap.TerrainDescriptor.base(this, 'persist', opt_obj);
};


/**
 * @inheritDoc
 */
plugin.basemap.TerrainDescriptor.prototype.restore = function(conf) {
  this.setTerrainOptions(conf['terrainOptions'] || null);
  this.setTerrainType(conf['terrainType'] || null);

  plugin.basemap.TerrainDescriptor.base(this, 'restore', conf);
  this.updateActiveFromTemp();
};
