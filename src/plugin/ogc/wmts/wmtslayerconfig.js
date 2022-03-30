goog.declareModuleId('plugin.ogc.wmts.WMTSLayerConfig');

import {equivalent, get} from 'ol/src/proj.js';
import WMTSSource from 'ol/src/source/WMTS.js';
import AnimatedTile from '../../../os/layer/animatedtile.js';
import AbstractTileLayerConfig from '../../../os/layer/config/abstracttilelayerconfig.js';
import {getTimeKey} from '../../../os/ogc/wmts/wmts.js';


/**
 * Creates a WMTS layer.
 */
export default class WMTSLayerConfig extends AbstractTileLayerConfig {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {boolean}
     * @protected
     */
    this.animate = false;
  }

  /**
   * @inheritDoc
   */
  initializeConfig(options) {
    super.initializeConfig(options);
    this.animate = !!options['animate'];
    this.layerClass = this.animate ? AnimatedTile : this.layerClass;

    delete options['minZoom'];
    delete options['maxZoom'];
    delete options['minResolution'];
    delete options['maxResolution'];
  }

  /**
   * @inheritDoc
   */
  configureLayer(layer, options) {
    super.configureLayer(layer, options);

    if (this.animate) {
      if (layer instanceof AnimatedTile) {
        const animatedLayer = /** @type {AnimatedTile} */ (layer);
        animatedLayer.setTimeFunction(WMTSLayerConfig.timeFunction_);

        if (options['dateFormat']) {
          animatedLayer.setDateFormat(/** @type {string} */ (options['dateFormat']));
        }

        if (options['timeFormat']) {
          animatedLayer.setTimeFormat(/** @type {string} */ (options['timeFormat']));
        }
      }
    }
  }

  /**
   * @inheritDoc
   */
  getSource(options) {
    const list = options['wmtsOptions'];

    if (!list || !Array.isArray(list)) {
      throw new Error('wmtsOptions must be set on the layer config for WMTS layers');
    }

    const projection = this.projection;
    const wmtsOptions = list.find((opts) => {
      return equivalent(get(opts.projection), get(projection));
    });

    // ensure the time key in URL templates matches the case in the dimension set
    if (wmtsOptions.dimensions) {
      const timeKey = getTimeKey(wmtsOptions.dimensions);
      if (timeKey) {
        wmtsOptions.urls = wmtsOptions.urls.map((url) => url.replace(/\{time\}/ig, '{' + timeKey + '}'));
      }
    }

    this.urls = wmtsOptions.urls;
    return new WMTSSource(wmtsOptions);
  }

  /**
   * @param {string} timeValue
   * @this {AnimatedTile}
   * @private
   */
  static timeFunction_(timeValue) {
    const source = /** @type {WMTSSource} */ (this.getSource());
    const dimensions = source.getDimensions();

    // update the time value if a time key is present in the dimensions
    const timeKey = getTimeKey(dimensions);
    if (timeKey) {
      dimensions[timeKey] = timeValue;
      source.updateDimensions(dimensions);
    }
  }
}
