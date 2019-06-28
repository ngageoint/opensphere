goog.provide('plugin.wmts.LayerConfig');

goog.require('ol.array');
goog.require('ol.source.WMTS');
goog.require('os.layer.config.AbstractTileLayerConfig');


/**
 * Creates a WMTS layer.
 *
 * @extends {os.layer.config.AbstractTileLayerConfig}
 * @constructor
 */
plugin.wmts.LayerConfig = function() {
  plugin.wmts.LayerConfig.base(this, 'constructor');

  /**
   * @type {boolean}
   * @protected
   */
  this.animate = false;
};
goog.inherits(plugin.wmts.LayerConfig, os.layer.config.AbstractTileLayerConfig);


/**
 * @inheritDoc
 */
plugin.wmts.LayerConfig.prototype.initializeConfig = function(options) {
  plugin.wmts.LayerConfig.base(this, 'initializeConfig', options);
  this.animate = !!options['animate'];
  this.layerClass = this.animate ? os.layer.AnimatedTile : this.layerClass;

  delete options['minZoom'];
  delete options['maxZoom'];
  delete options['minResolution'];
  delete options['maxResolution'];
};


/**
 * @inheritDoc
 */
plugin.wmts.LayerConfig.prototype.configureLayer = function(layer, options) {
  plugin.wmts.LayerConfig.base(this, 'configureLayer', layer, options);

  if (this.animate) {
    if (layer instanceof os.layer.AnimatedTile) {
      var animatedLayer = /** @type {os.layer.AnimatedTile} */ (layer);
      animatedLayer.setTimeFunction(plugin.wmts.LayerConfig.timeFunction_);

      if (options['dateFormat']) {
        animatedLayer.setDateFormat(/** @type {string} */ (options['dateFormat']));
      }

      if (options['timeFormat']) {
        animatedLayer.setTimeFormat(/** @type {string} */ (options['timeFormat']));
      }
    }
  }
};


/**
 * @param {string} timeValue
 * @this {os.layer.AnimatedTile}
 * @private
 */
plugin.wmts.LayerConfig.timeFunction_ = function(timeValue) {
  var source = /** @type {ol.source.WMTS} */ (this.getSource());
  var dimensions = source.getDimensions();
  dimensions['time'] = timeValue;
  source.updateDimensions(dimensions);
};


/**
 * @inheritDoc
 */
plugin.wmts.LayerConfig.prototype.getSource = function(options) {
  var list = options['wmtsOptions'];

  if (!list || !Array.isArray(list)) {
    throw new Error('wmtsOptions must be set on the layer config for WMTS layers');
  }

  var projection = this.projection;
  var wmtsOptions = ol.array.find(list, function(opts) {
    return ol.proj.equivalent(ol.proj.get(opts.projection), ol.proj.get(projection));
  });

  // ensure the time key in URL templates matches the case in the dimension set
  if (wmtsOptions.dimensions) {
    var timeKey;
    for (var key in wmtsOptions.dimensions) {
      if (/time/i.test(key)) {
        timeKey = key;
      }
    }

    if (timeKey) {
      wmtsOptions.urls = wmtsOptions.urls.map(function(url) {
        return url.replace(/\{time}/ig, '{' + timeKey + '}');
      });
    }
  }

  this.urls = wmtsOptions.urls;
  return new ol.source.WMTS(wmtsOptions);
};
