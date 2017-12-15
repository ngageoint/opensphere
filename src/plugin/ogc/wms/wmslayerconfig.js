goog.provide('plugin.ogc.wms.WMSLayerConfig');

goog.require('os.layer.AnimatedTile');
goog.require('os.layer.config.AbstractTileLayerConfig');
goog.require('plugin.ogc.wms.TileWMSSource');



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
 *
 * @extends {os.layer.config.AbstractTileLayerConfig}
 * @constructor
 */
plugin.ogc.wms.WMSLayerConfig = function() {
  plugin.ogc.wms.WMSLayerConfig.base(this, 'constructor');

  /**
   * @type {boolean}
   * @protected
   */
  this.animate = false;
};
goog.inherits(plugin.ogc.wms.WMSLayerConfig, os.layer.config.AbstractTileLayerConfig);


/**
 * @inheritDoc
 */
plugin.ogc.wms.WMSLayerConfig.prototype.initializeConfig = function(options) {
  plugin.ogc.wms.WMSLayerConfig.base(this, 'initializeConfig', options);
  this.tileClass = options['animate'] ? os.layer.AnimatedTile : this.tileClass;
};


/**
 * @inheritDoc
 */
plugin.ogc.wms.WMSLayerConfig.prototype.configureLayer = function(layer, options) {
  plugin.ogc.wms.WMSLayerConfig.base(this, 'configureLayer', layer, options);

  layer.setStyles(/** @type {?Array<osx.ogc.TileStyle>} */ (options['styles'] || null));

  if (this.animate) {
    if (layer instanceof os.layer.AnimatedTile && options['dateFormat']) {
      /** @type {os.layer.AnimatedTile} */ (layer).setDateFormat(/** @type {string} */ (options['dateFormat']));
    }
  }
};


/**
 * @inheritDoc
 */
plugin.ogc.wms.WMSLayerConfig.prototype.getSource = function(options) {
  var params = {'EXCEPTIONS': 'INIMAGE'};
  if (this.params) {
    var version = this.params.get('VERSION');
    params['EXCEPTIONS'] = version === '1.1.1' ? 'application/vnd.ogc.se_inimage' : 'INIMAGE';
    var keys = this.params.getKeys();
    for (var i = 0, n = keys.length; i < n; i++) {
      var key = keys[i];
      params[key.toUpperCase()] = this.params.get(key);
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

  return new plugin.ogc.wms.TileWMSSource(wmsOptions);
};


/**
 * @inheritDoc
 */
plugin.ogc.wms.WMSLayerConfig.prototype.getTileWidth = function(options) {
  if (this.params) {
    var keys = this.params.getKeys();
    for (var i = 0, n = keys.length; i < n; i++) {
      if (keys[i].toUpperCase() == 'WIDTH') {
        return parseInt(this.params.get(keys[i]), 10);
      }
    }
  }

  return plugin.ogc.wms.WMSLayerConfig.base(this, 'getTileWidth', options);
};


/**
 * @inheritDoc
 */
plugin.ogc.wms.WMSLayerConfig.prototype.getTileHeight = function(options) {
  if (this.params) {
    var keys = this.params.getKeys();
    for (var i = 0, n = keys.length; i < n; i++) {
      if (keys[i].toUpperCase() == 'HEIGHT') {
        return parseInt(this.params.get(keys[i]), 10);
      }
    }
  }

  return plugin.ogc.wms.WMSLayerConfig.base(this, 'getTileHeight', options);
};

