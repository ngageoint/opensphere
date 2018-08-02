goog.provide('plugin.basemap.v4.BaseMapState');
goog.provide('plugin.basemap.v4.BaseMapTag');

goog.require('goog.string');
goog.require('os.net');
goog.require('os.state.v4.LayerState');
goog.require('plugin.basemap');
goog.require('plugin.basemap.layer.BaseMap');


/**
 * XML tags for base map state
 * @enum {string}
 */
plugin.basemap.v4.BaseMapTag = {
  MAX_ZOOM: 'maxZoom',
  MIN_ZOOM: 'minZoom'
};



/**
 * @extends {os.state.v4.LayerState}
 * @constructor
 */
plugin.basemap.v4.BaseMapState = function() {
  plugin.basemap.v4.BaseMapState.base(this, 'constructor');
  this.description = 'Saves the current map layers';
  this['enabled'] = false;
  this.rootName = 'mapLayers';
  this.rootAttrs = {
    'type': 'map'
  };
  this.title = 'Map Layers';

  /**
   * @type {goog.log.Logger}
   * @protected
   */
  this.logger = plugin.basemap.v4.BaseMapState.LOGGER_;
};
goog.inherits(plugin.basemap.v4.BaseMapState, os.state.v4.LayerState);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.basemap.v4.BaseMapState.LOGGER_ = goog.log.getLogger('plugin.basemap.v4.BaseMapState');


/**
 * @inheritDoc
 */
plugin.basemap.v4.BaseMapState.prototype.isValid = function(layer) {
  try {
    return layer instanceof plugin.basemap.layer.BaseMap && goog.isDefAndNotNull(layer.getLayerOptions());
  } catch (e) {
    // may not be a os.layer.ILayer... so don't persist it
  }

  return false;
};


/**
 * @inheritDoc
 */
plugin.basemap.v4.BaseMapState.prototype.layerToXML = function(layer, options, opt_exclusions, opt_layerConfig) {
  var layerEl = plugin.basemap.v4.BaseMapState.base(this, 'layerToXML',
      layer, options, opt_exclusions, opt_layerConfig);
  if (layerEl) {
    goog.dom.xml.setAttributes(layerEl, {
      'type': layer.getLayerOptions()['baseType'] || 'wms'
    });
  }
  return layerEl;
};


/**
 * @inheritDoc
 */
plugin.basemap.v4.BaseMapState.prototype.defaultConfigToXML = function(key, value, layerEl) {
  switch (key) {
    case 'minResolution':
      var maxZoom = Math.round(os.MapContainer.getInstance().resolutionToZoom(/** @type {number} */ (value)) - 1);
      os.xml.appendElement(plugin.basemap.v4.BaseMapTag.MAX_ZOOM, layerEl, maxZoom);
      break;
    case 'maxResolution':
      var minZoom = Math.round(os.MapContainer.getInstance().resolutionToZoom(/** @type {number} */ (value)) - 1);
      os.xml.appendElement(plugin.basemap.v4.BaseMapTag.MIN_ZOOM, layerEl, minZoom);
      break;
    case 'minZoom':
    case 'maxZoom':
      // ignore these - min/max resolution will be converted instead
      break;
    default:
      plugin.basemap.v4.BaseMapState.base(this, 'defaultConfigToXML', key, value, layerEl);
      break;
  }
};


/**
 * @inheritDoc
 */
plugin.basemap.v4.BaseMapState.prototype.xmlToOptions = function(node) {
  var options = plugin.basemap.v4.BaseMapState.base(this, 'xmlToOptions', node);
  options['baseType'] = options['type'].toUpperCase();
  options['layerType'] = plugin.basemap.LAYER_TYPE;
  options['type'] = plugin.basemap.TYPE;
  options['id'] = options['id'].replace(os.ui.data.BaseProvider.ID_DELIMITER, '-');

  if (typeof options['url'] == 'string') {
    options['crossOrigin'] = os.net.getCrossOrigin(/** @type {string} */ (options['url']));
  }

  // some notes on what's going on below:
  // - zoom is 1 higher in opensphere than in legacy apps
  // - the closure compiler doesn't remember goog.isNumber when bracket notation is used, thus the extra var
  var minZoom = options['minZoom'];
  if (goog.isNumber(minZoom)) {
    options['minZoom'] = minZoom + 1;
  }

  var maxZoom = options['maxZoom'];
  if (goog.isNumber(maxZoom)) {
    options['maxZoom'] = maxZoom + 1;
  }

  return options;
};
