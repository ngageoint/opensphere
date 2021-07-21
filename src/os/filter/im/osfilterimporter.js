goog.module('os.filter.im.OSFilterImporter');
goog.module.declareLegacyNamespace();

const {toHexString} = goog.require('os.color');
const osImplements = goog.require('os.implements');
const ILayer = goog.require('os.layer.ILayer');
const FilterImporter = goog.require('os.ui.filter.im.FilterImporter');

/**
 * @template T
 */
class OSFilterImporter extends FilterImporter {
  /**
   * Constructor.
   * @param {os.parse.IParser<T>} parser The parser.
   * @param {string=} opt_layerId The layer id.
   * @param {boolean=} opt_keepId If the original entry id should be preserved. Defaults to false.
   */
  constructor(parser, opt_layerId, opt_keepId) {
    super(parser, opt_layerId, opt_keepId);
  }

  /**
   * @inheritDoc
   */
  getProviderFromFilterable(filterable) {
    var provider = super.getProviderFromFilterable(filterable);

    // if the filterable implements a provider name interface function, add that to the title
    if (!provider && osImplements(filterable, ILayer.ID)) {
      provider = /** @type {!ILayer} */ (filterable).getProvider();
    }

    return provider;
  }

  /**
   * @inheritDoc
   */
  getIconsFromFilterable(filterable) {
    if (osImplements(filterable, ILayer.ID)) {
      var options = /** @type {!ILayer} */ (filterable).getLayerOptions();
      var color = /** @type {string|undefined} */ (options['color']);
      if (color) {
        return '<i class="fa fa-bars" style="color:' + toHexString(color) + '"></i>';
      }
    }

    return super.getIconsFromFilterable(filterable);
  }
}

exports = OSFilterImporter;
