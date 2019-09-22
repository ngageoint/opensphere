goog.provide('os.filter.im.OSFilterImporter');

goog.require('os.color');
goog.require('os.implements');
goog.require('os.layer.ILayer');
goog.require('os.ui.filter.im.FilterImporter');


/**
 * @param {os.parse.IParser<T>} parser The parser.
 * @param {string=} opt_layerId The layer id.
 * @param {boolean=} opt_keepId If the original entry id should be preserved. Defaults to false.
 * @extends {os.ui.filter.im.FilterImporter}
 * @constructor
 * @template T
 */
os.filter.im.OSFilterImporter = function(parser, opt_layerId, opt_keepId) {
  os.filter.im.OSFilterImporter.base(this, 'constructor', parser, opt_layerId, opt_keepId);
};
goog.inherits(os.filter.im.OSFilterImporter, os.ui.filter.im.FilterImporter);


/**
 * @inheritDoc
 */
os.filter.im.OSFilterImporter.prototype.getProviderFromFilterable = function(filterable) {
  var provider = os.filter.im.OSFilterImporter.base(this, 'getProviderFromFilterable', filterable);

  // if the filterable implements a provider name interface function, add that to the title
  if (!provider && os.implements(filterable, os.layer.ILayer.ID)) {
    provider = /** @type {!os.layer.ILayer} */ (filterable).getProvider();
  }

  return provider;
};


/**
 * @inheritDoc
 */
os.filter.im.OSFilterImporter.prototype.getIconsFromFilterable = function(filterable) {
  if (os.implements(filterable, os.layer.ILayer.ID)) {
    var options = /** @type {!os.layer.ILayer} */ (filterable).getLayerOptions();
    var color = /** @type {string|undefined} */ (options['color']);
    if (color) {
      return '<i class="fa fa-bars" style="color:' + os.color.toHexString(color) + '"></i>';
    }
  }

  return os.filter.im.OSFilterImporter.base(this, 'getIconsFromFilterable', filterable);
};
