goog.module('plugin.ogc.wms.WMSLayerConfig');
goog.module.declareLegacyNamespace();

const AnimatedTile = goog.require('os.layer.AnimatedTile');
const AbstractTileLayerConfig = goog.require('os.layer.config.AbstractTileLayerConfig');
const TileWMSSource = goog.require('plugin.ogc.wms.TileWMSSource');


/**
 * Creates a WMS layer.
 *
 * @example <caption>Example WMS map layer config</caption>
 * "wmsMapLayer": {
 *   "type": "BaseMap",
 *   "baseType": "WMS",
 *
 *   // these apply to the base map config
 *   "minZoom": 2,
 *   "maxZoom": 9,
 *
 *   // These are generic to all configs
 *   "crossOrigin": "none",
 *   "title": "Example Map Layer",
 *   "description": "A fine map",
 *   "tags": ["fine", "map"],
 *
 *   // WMS configuration
 *   "url": "/ogc/wmsServer",
 *   "params": "layers=LayerName&format=image/gif&transparent=true"
 * }
 *
 * @example <caption>Example WMS map overlay config</caption>
 * {
 *   "type": "WMS",
 *   ... Everything else is the same as above other than minZoom/maxZoom
 *
 * }
 *
 * @example <caption>Example animated WMS overlay config</caption>
 * {
 *   "type": "WMS"
 *
 *   // generic config
 *   "crossOrigin": "anonymous",
 *   "title": "Weather",
 *   "description": "Weather animated over time",
 *   "color": 0x00FF00,
 *   "layerType": "Tile Layers",
 *   "tags": ["weather"],
 *
 *   // WMS configuration
 *   "url": "http://fancyweather.com/wms",
 *   "params": "layers=radar",
 *
 *   // animation
 *   "animate": true,
 *   "dateFormat": "YYYYMMDD[Z]", // defaults to full ISO-8601 if not provided
 * }
 *
 * This will produce a WMS layer which queries for TIME=&lt;formattedStartDate&gt;/&lt;formattedEndDate&gt;
 */
class WMSLayerConfig extends AbstractTileLayerConfig {
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
  }

  /**
   * @inheritDoc
   */
  configureLayer(layer, options) {
    super.configureLayer(layer, options);

    layer.setStyles(/** @type {?Array<osx.ogc.TileStyle>} */ (options['styles'] || null));

    if (this.animate) {
      if (layer instanceof AnimatedTile) {
        var animatedLayer = /** @type {AnimatedTile} */ (layer);
        animatedLayer.setTimeFunction(AnimatedTile.updateParams);

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
    var params = {'EXCEPTIONS': 'INIMAGE'};
    if (this.params) {
      var version = this.params.get('VERSION');
      params['EXCEPTIONS'] = version === '1.1.1' ? 'application/vnd.ogc.se_inimage' : 'INIMAGE';
      var keys = this.params.getKeys();
      for (var i = 0, n = keys.length; i < n; i++) {
        var key = keys[i];
        params[options['caseSensitive'] ? key : key.toUpperCase()] = this.params.get(key);
      }
    }

    var wmsOptions = /** @type {olx.source.TileWMSOptions} */ ({
      urls: this.urls,
      params: params,
      projection: this.projection,
      tileGrid: this.tileGrid,
      crossOrigin: this.crossOrigin,
      wrapX: this.projection.isGlobal()
    });

    return new TileWMSSource(wmsOptions);
  }

  /**
   * @inheritDoc
   */
  getTileWidth(options) {
    if (this.params) {
      var keys = this.params.getKeys();
      for (var i = 0, n = keys.length; i < n; i++) {
        if (keys[i].toUpperCase() == 'WIDTH') {
          return parseInt(this.params.get(keys[i]), 10);
        }
      }
    }

    return super.getTileWidth(options);
  }

  /**
   * @inheritDoc
   */
  getTileHeight(options) {
    if (this.params) {
      var keys = this.params.getKeys();
      for (var i = 0, n = keys.length; i < n; i++) {
        if (keys[i].toUpperCase() == 'HEIGHT') {
          return parseInt(this.params.get(keys[i]), 10);
        }
      }
    }

    return super.getTileHeight(options);
  }
}

exports = WMSLayerConfig;
