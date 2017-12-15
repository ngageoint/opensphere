goog.provide('plugin.basemap.Group');
goog.require('os.data.ZOrderEventType');
goog.require('os.layer.Group');



/**
 * @extends {os.layer.Group}
 * @param {olx.layer.GroupOptions=} opt_options
 * @constructor
 */
plugin.basemap.Group = function(opt_options) {
  plugin.basemap.Group.base(this, 'constructor', opt_options);

  this.setPriority(-1000);
  this.setCheckFunc(plugin.basemap.isBaseMap);
  this.setOSType(plugin.basemap.LAYER_TYPE);
};
goog.inherits(plugin.basemap.Group, os.layer.Group);
