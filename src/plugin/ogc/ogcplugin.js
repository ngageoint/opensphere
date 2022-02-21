goog.declareModuleId('plugin.ogc.OGCPlugin');

import DataManager from '../../os/data/datamanager.js';
import ProviderEntry from '../../os/data/providerentry.js';
import LayerConfigManager from '../../os/layer/config/layerconfigmanager.js';
import * as net from '../../os/net/net.js';
import LayerType from '../../os/ogc/layertype.js';
import * as osOgc from '../../os/ogc/ogc.js';
import AbstractPlugin from '../../os/plugin/abstractplugin.js';
import ImportManager from '../../os/ui/im/importmanager.js';
import OGCServer from '../../os/ui/ogc/ogcserver.js';
import ProviderImportUI from '../../os/ui/providerimportui.js';
import GeoServer from './geoserver.js';
import * as mime from './mime.js';
import OGCLayerDescriptor from './ogclayerdescriptor.js';
import * as GeoServerHelpUI from './ui/geoserverhelp.js';
import {directiveTag as geoserverImportUi} from './ui/geoserverimport.js';
import * as GeoserverImportForm from './ui/geoserverimportform.js';
import * as OgcServerHelpUI from './ui/ogcserverhelp.js';
import {directiveTag as ogcImportUi} from './ui/ogcserverimport.js';
import * as OgcServerImportForm from './ui/ogcserverimportform.js';
import QueryWFSLayerConfig from './wfs/querywfslayerconfig.js';
import WMSLayerConfig from './wms/wmslayerconfig.js';
import WMTSLayerConfig from './wmts/wmtslayerconfig.js';
import WMTSServer from './wmts/wmtsserver.js';


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
