goog.module('plugin.basemap.v4.BaseMapState');
goog.module.declareLegacyNamespace();

const googDomXml = goog.require('goog.dom.xml');
const log = goog.require('goog.log');
const MapContainer = goog.require('os.MapContainer');
const LayerState = goog.require('os.state.v4.LayerState');
const BaseProvider = goog.require('os.ui.data.BaseProvider');
const xml = goog.require('os.xml');
const basemap = goog.require('plugin.basemap');
const BaseMap = goog.require('plugin.basemap.layer.BaseMap');
const BaseMapTag = goog.require('plugin.basemap.v4.BaseMapTag');


/**
 * Basemap state v4.
 * @unrestricted
 */
class BaseMapState extends LayerState {
  /**
   * Constructor.
   */
  constructor() {
    super();
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
    this.logger = logger;
  }

  /**
   * @inheritDoc
   */
  isValid(layer) {
    try {
      return layer instanceof BaseMap && layer.getLayerOptions() != null;
    } catch (e) {
      // may not be a os.layer.ILayer... so don't persist it
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  layerToXML(layer, options, opt_exclusions, opt_layerConfig) {
    var layerEl = super.layerToXML(layer, options, opt_exclusions, opt_layerConfig);
    if (layerEl) {
      googDomXml.setAttributes(layerEl, {
        'type': layer.getLayerOptions()['baseType'] || 'wms'
      });
    }
    return layerEl;
  }

  /**
   * @inheritDoc
   */
  defaultConfigToXML(key, value, layerEl) {
    switch (key) {
      case 'minResolution':
        if (!hasMaxZoom(layerEl) && typeof value === 'number') {
          var maxZoom = Math.round(MapContainer.getInstance().resolutionToZoom(/** @type {number} */ (value)) - 1);
          xml.appendElement(BaseMapTag.MAX_ZOOM, layerEl, maxZoom);
        }
        break;
      case 'maxResolution':
        if (!hasMinZoom(layerEl) && typeof value === 'number') {
          var minZoom = Math.round(MapContainer.getInstance().resolutionToZoom(/** @type {number} */ (value)) - 1);
          xml.appendElement(BaseMapTag.MIN_ZOOM, layerEl, minZoom);
        }
        break;
      case 'minZoom':
        if (!hasMinZoom(layerEl) && typeof value === 'number') {
          xml.appendElement(BaseMapTag.MIN_ZOOM, layerEl, value - 1);
        }
        break;
      case 'maxZoom':
        if (!hasMaxZoom(layerEl) && typeof value === 'number') {
          xml.appendElement(BaseMapTag.MAX_ZOOM, layerEl, value - 1);
        }
        break;
      default:
        super.defaultConfigToXML(key, value, layerEl);
        break;
    }
  }

  /**
   * @inheritDoc
   */
  xmlToOptions(node) {
    var options = super.xmlToOptions(node);
    options['baseType'] = options['type'].toUpperCase();
    options['layerType'] = basemap.LAYER_TYPE;
    options['type'] = basemap.TYPE;
    options['id'] = options['id'].replace(BaseProvider.ID_DELIMITER, '-');

    // zoom is 1 higher in opensphere than in legacy apps
    if (typeof options['minZoom'] === 'number') {
      options['minZoom'] = options['minZoom'] + 1;
    }

    if (typeof options['maxZoom'] === 'number') {
      options['maxZoom'] = options['maxZoom'] + 1;
    }

    return options;
  }
}


/**
 * If a max zoom element is present.
 * @param {!Element} el
 * @return {boolean}
 */
const hasMaxZoom = (el) => !!el.querySelector(BaseMapTag.MAX_ZOOM);


/**
 * If a min zoom element is present.
 * @param {!Element} el
 * @return {boolean}
 */
const hasMinZoom = (el) => !!el.querySelector(BaseMapTag.MIN_ZOOM);


/**
 * Logger
 * @type {goog.log.Logger}
 */
const logger = log.getLogger('plugin.basemap.v4.BaseMapState');


exports = BaseMapState;
