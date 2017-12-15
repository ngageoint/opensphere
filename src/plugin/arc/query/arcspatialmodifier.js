goog.provide('plugin.arc.query.ArcSpatialModifier');
goog.require('os.net.ParamModifier');



/**
 * @extends {os.net.ParamModifier}
 * @constructor
 */
plugin.arc.query.ArcSpatialModifier = function() {
  plugin.arc.query.ArcSpatialModifier.base(this, 'constructor', 'ArcSpatial', 'geometry', '', '', 100);
};
goog.inherits(plugin.arc.query.ArcSpatialModifier, os.net.ParamModifier);


/**
 * @inheritDoc
 */
plugin.arc.query.ArcSpatialModifier.prototype.modify = function(uri) {
  var replacement = this.getReplacement();
  if (replacement) {
    uri.getQueryData().set('geometry', replacement);
  }
};
