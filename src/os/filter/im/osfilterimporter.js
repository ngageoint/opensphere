goog.declareModuleId('os.filter.im.OSFilterImporter');

import {toHexString} from '../../color.js';
import osImplements from '../../implements.js';
import ILayer from '../../layer/ilayer.js';
import FilterImporter from '../../ui/filter/im/filterimporter.js';

const {default: IParser} = goog.requireType('os.parse.IParser');


/**
 * @template T
 */
export default class OSFilterImporter extends FilterImporter {
  /**
   * Constructor.
   * @param {IParser<T>} parser The parser.
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
