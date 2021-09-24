goog.declareModuleId('plugin.ogc.OGCPlugin');

const DataManager = goog.require('os.data.DataManager');
const ProviderEntry = goog.require('os.data.ProviderEntry');
const LayerConfigManager = goog.require('os.layer.config.LayerConfigManager');
const net = goog.require('os.net');
const osOgc = goog.require('os.ogc');
const LayerType = goog.require('os.ogc.LayerType');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const ProviderImportUI = goog.require('os.ui.ProviderImportUI');
const ImportManager = goog.require('os.ui.im.ImportManager');
const OGCServer = goog.require('os.ui.ogc.OGCServer');
const GeoServer = goog.require('plugin.ogc.GeoServer');
const OGCLayerDescriptor = goog.require('plugin.ogc.OGCLayerDescriptor');
const mime = goog.require('plugin.ogc.mime');
const GeoServerHelpUI = goog.require('plugin.ogc.ui.GeoServerHelpUI');
const GeoserverImportForm = goog.require('plugin.ogc.ui.GeoserverImportForm');
const {directiveTag: geoserverImportUi} = goog.require('plugin.ogc.ui.GeoserverImportUI');
const OgcServerHelpUI = goog.require('plugin.ogc.ui.OgcServerHelpUI');
const OgcServerImportForm = goog.require('plugin.ogc.ui.OgcServerImportForm');
const {directiveTag: ogcImportUi} = goog.require('plugin.ogc.ui.OgcServerImportUI');
const QueryWFSLayerConfig = goog.require('plugin.ogc.wfs.QueryWFSLayerConfig');
const WMSLayerConfig = goog.require('plugin.ogc.wms.WMSLayerConfig');
const WMTSLayerConfig = goog.require('plugin.ogc.wmts.WMTSLayerConfig');
const WMTSServer = goog.require('plugin.ogc.wmts.WMTSServer');


/**
 * Provides WMS/WFS layer support, both separately and as a grouped layer combination.
 */
export default class OGCPlugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = osOgc.ID;
  }

  /**
   * @inheritDoc
   */
  init() {
    var dm = DataManager.getInstance();

    var ogc = new ProviderEntry(osOgc.ID, OGCServer, 'OGC Server',
        'OGC Servers provide raster imagery through WMS (Web Map Service) and vector features through WFS' +
      ' (Web Feature Service) servers');

    var geo = new ProviderEntry(mime.GEOSERVER_TYPE, GeoServer, 'GeoServer', '');

    var wmts = new ProviderEntry(WMTSServer.TYPE, WMTSServer, 'WMTS Server', '');

    // register the ogc provider types
    dm.registerProviderType(ogc);
    dm.registerProviderType(geo);
    dm.registerProviderType(wmts);

    // register the ogc descriptor types
    dm.registerDescriptorType(osOgc.ID, OGCLayerDescriptor);

    // register the layer configurations
    var lcm = LayerConfigManager.getInstance();
    lcm.registerLayerConfig(LayerType.WMS, WMSLayerConfig);
    lcm.registerLayerConfig(LayerType.WFS, QueryWFSLayerConfig);
    lcm.registerLayerConfig(LayerType.WMTS, WMTSLayerConfig);
    lcm.registerDefaultLayerConfig(LayerType.WFS, getDefaultWfsOptions);

    // register the server forms for adding/editing servers
    var im = ImportManager.getInstance();
    im.registerImportUI(osOgc.ID, new ProviderImportUI(`<${ogcImportUi}></${ogcImportUi}>`));
    im.registerServerType(osOgc.ID, {
      type: 'ogc',
      helpUi: OgcServerHelpUI.directiveTag,
      formUi: OgcServerImportForm.directiveTag,
      label: 'OGC Server'
    });
    im.registerImportUI(mime.GEOSERVER_TYPE,
        new ProviderImportUI(`<${geoserverImportUi}></${geoserverImportUi}>`));
    im.registerServerType(mime.GEOSERVER_TYPE, {
      type: 'geoserver',
      helpUi: GeoServerHelpUI.directiveTag,
      formUi: GeoserverImportForm.directiveTag,
      label: 'GeoServer'
    });

    net.registerDefaultValidator(osOgc.getException);
  }
}

/**
 * Get the default opensphere WFS layer options
 *
 * @return {!Object<string, *>}
 */
const getDefaultWfsOptions = function() {
  var options = osOgc.getDefaultWfsOptions();

  // opensphere handles this per-request based on the feature limit imposed by 2D/3D mode, so exclude it from the request
  // parameters
  options['params'].remove('maxfeatures');
  options['params'].remove('outputformat');

  return options;
};
