goog.provide('plugin.arc.query.ArcFilterModifier');
goog.require('os.net.ParamModifier');



/**
 * @extends {os.net.ParamModifier}
 * @constructor
 */
plugin.arc.query.ArcFilterModifier = function() {
  plugin.arc.query.ArcFilterModifier.base(this, 'constructor', 'ArcFilter', 'where', '', '', 100);
};
goog.inherits(plugin.arc.query.ArcFilterModifier, os.net.ParamModifier);


/**
 * @inheritDoc
 */
plugin.arc.query.ArcFilterModifier.prototype.modify = function(uri) {
  var replacement = this.getReplacement();
  if (replacement) {
    uri.getQueryData().set('where', replacement);
  } else {
    uri.getQueryData().remove('where');
  }
};
