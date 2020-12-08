goog.module('plugin.basemap.v2.BaseMapState');
goog.module.declareLegacyNamespace();

goog.require('goog.string');

const ui = goog.require('os.ui');
const MapContainer = goog.require('os.MapContainer');
const net = goog.require('os.net');
const LayerState = goog.require('os.state.v2.LayerState');
const basemap = goog.require('plugin.basemap');
const BaseMap = goog.require('plugin.basemap.layer.BaseMap');
const BaseMapTag = goog.require('plugin.basemap.v2.BaseMapTag');



/**
 */
class BaseMapState extends LayerState {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.description = 'Saves the current map layers';
    this['enabled'] = false;
    this.rootAttrs = {
      'type': 'map'
    };
    this.title = 'Map Layers';

    /**
     * @type {goog.log.Logger}
     * @protected
     */
    this.logger = BaseMapState.LOGGER_;
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
      goog.dom.xml.setAttributes(layerEl, {
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
        var maxZoom = Math.round(MapContainer.getInstance().resolutionToZoom(/** @type {number} */ (value)) - 1);
        os.xml.appendElement(BaseMapTag.MAX_ZOOM, layerEl, maxZoom);
        break;
      case 'maxResolution':
        var minZoom = Math.round(MapContainer.getInstance().resolutionToZoom(/** @type {number} */ (value)) - 1);
        os.xml.appendElement(BaseMapTag.MIN_ZOOM, layerEl, minZoom);
        break;
      case 'minZoom':
      case 'maxZoom':
        // ignore these - min/max resolution will be converted instead
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
    options['id'] = options['id'].replace(ui.data.BaseProvider.ID_DELIMITER, '-');

    if (typeof options['url'] == 'string') {
      options['crossOrigin'] = net.getCrossOrigin(/** @type {string} */ (options['url']));
    }

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
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
BaseMapState.LOGGER_ = goog.log.getLogger('plugin.basemap.v2.BaseMapState');


exports = BaseMapState;
