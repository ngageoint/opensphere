goog.module('plugin.ogc.wmts.WMTSLayerConfig');
goog.module.declareLegacyNamespace();

const olProj = goog.require('ol.proj');
const WMTSSource = goog.require('ol.source.WMTS');
const AnimatedTile = goog.require('os.layer.AnimatedTile');
const AbstractTileLayerConfig = goog.require('os.layer.config.AbstractTileLayerConfig');


/**
 * Creates a WMTS layer.
 */
class WMTSLayerConfig extends AbstractTileLayerConfig {
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
      return olProj.equivalent(olProj.get(opts.projection), olProj.get(projection));
    });

    // ensure the time key in URL templates matches the case in the dimension set
    if (wmtsOptions.dimensions) {
      let timeKey;
      for (const key in wmtsOptions.dimensions) {
        if (/time/i.test(key)) {
          timeKey = key;
        }
      }

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
    dimensions['time'] = timeValue;
    source.updateDimensions(dimensions);
  }
}

exports = WMTSLayerConfig;
