goog.provide('plugin.basemap.BaseMapDescriptor');
goog.require('goog.object');
goog.require('os.data.LayerSyncDescriptor');
goog.require('os.events.LayerConfigEvent');
goog.require('os.events.LayerEvent');
goog.require('os.events.LayerEventType');
goog.require('os.map');
goog.require('os.object');
goog.require('os.ui.Icons');
goog.require('plugin.basemap');



/**
 * A descriptor for a base map (or "Map Layer")
 *
 * @extends {os.data.LayerSyncDescriptor}
 * @constructor
 * @see {@link plugin.basemap.BaseMapPlugin} for configuration instructions
 */
plugin.basemap.BaseMapDescriptor = function() {
  plugin.basemap.BaseMapDescriptor.base(this, 'constructor');

  /**
   * @type {boolean}
   * @private
   */
  this.canDelete_ = true;

  /**
   * @type {Object.<string, *>}
   * @private
   */
  this.origConf_ = null;

  this.setTags(['GEOINT']);
  this.setType(plugin.basemap.LAYER_TYPE);
  this.descriptorType = plugin.basemap.ID;
};
goog.inherits(plugin.basemap.BaseMapDescriptor, os.data.LayerSyncDescriptor);


/**
 * @param {!Object.<string, *>} value
 */
plugin.basemap.BaseMapDescriptor.prototype.setConfig = function(value) {
  this.origConf_ = value;

  // Layer type override from the base map config
  if (value['layerType']) {
    this.setType(value['layerType']);
  }
};


/**
 * @inheritDoc
 */
plugin.basemap.BaseMapDescriptor.prototype.getIcons = function() {
  return os.ui.Icons.TILES;
};


/**
 * Whether or not this map layer descriptor can be deleted by the user
 *
 * @return {boolean}
 */
plugin.basemap.BaseMapDescriptor.prototype.canDelete = function() {
  return this.canDelete_;
};


/**
 * Sets whether the user can delete this map layer or not
 *
 * @param {boolean} value The value
 */
plugin.basemap.BaseMapDescriptor.prototype.setCanDelete = function(value) {
  this.canDelete_ = value;
};


/**
 * @inheritDoc
 */
plugin.basemap.BaseMapDescriptor.prototype.getSearchType = function() {
  return 'Map Layer';
};


/**
 * @inheritDoc
 */
plugin.basemap.BaseMapDescriptor.prototype.getLayerOptions = function() {
  var options = goog.object.clone(this.origConf_);

  options['id'] = this.getId();
  options['provider'] = this.getProvider();
  options['animate'] = false;
  options['title'] = this.getTitle();
  options['layerType'] = this.getType();
  options['tags'] = this.getTags();
  options['noClear'] = true;

  return options;
};


/**
 * @inheritDoc
 */
plugin.basemap.BaseMapDescriptor.prototype.getProvider = function() {
  if (this.origConf_ && 'provider' in this.origConf_) {
    return /** @type {?string} */ (this.origConf_['provider']);
  }

  return plugin.basemap.BaseMapDescriptor.base(this, 'getProvider');
};


/**
 * Basemaps need to be more careful about their initial restoration. It's possible for a basemap to have been active in
 * a different projection from the one the application is currently in, causing the application to  immediately
 * try to switch projections upon loading. This works around that problem.
 *
 * @override
 */
plugin.basemap.BaseMapDescriptor.prototype.updateActiveFromTemp = function() {
  if (this.getLayerOptions()['projection'] === os.map.PROJECTION.getCode() && this.tempActive === true) {
    this.setActive(this.tempActive);
  }

  // unset temp active. It should only run once at load.
  this.tempActive = undefined;
};


/**
 * @inheritDoc
 */
plugin.basemap.BaseMapDescriptor.prototype.persist = function(opt_obj) {
  if (!opt_obj) {
    opt_obj = {};
  }

  opt_obj['canDelete'] = this.canDelete();
  opt_obj['origConf'] = this.origConf_;

  return plugin.basemap.BaseMapDescriptor.superClass_.persist.call(this, opt_obj);
};


/**
 * @inheritDoc
 */
plugin.basemap.BaseMapDescriptor.prototype.restore = function(from) {
  plugin.basemap.BaseMapDescriptor.superClass_.restore.call(this, from);

  this.origConf_ = from['origConf'];
  this.setCanDelete(from['canDelete']);

  if (!this.canDelete_ && isNaN(this.getDeleteTime())) {
    this.setDeleteTime(Date.now() + 24 * 60 * 60 * 1000);
  }
};
