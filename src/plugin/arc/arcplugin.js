goog.declareModuleId('plugin.arc.ArcPlugin');

import DataManager from '../../os/data/datamanager.js';
import ProviderEntry from '../../os/data/providerentry.js';
import LayerConfigManager from '../../os/layer/config/layerconfigmanager.js';
import * as net from '../../os/net/net.js';
import AbstractPlugin from '../../os/plugin/abstractplugin.js';
import StateManager from '../../os/state/statemanager.js';
import ImportManager from '../../os/ui/im/importmanager.js';
import ProviderImportUI from '../../os/ui/providerimportui.js';
import * as arc from './arc.js';
import ArcLoader from './arcloader.js';
import ArcServer from './arcserver.js';
import * as ArcServerHelpUI from './arcserverhelp.js';
import {directiveTag as arcImportEl} from './arcserverimport.js';
import * as ArcImportForm from './arcserverimportform.js';
import ArcFeatureLayerConfig from './layer/arcfeaturelayerconfig.js';
import ArcImageLayerConfig from './layer/arcimagelayerconfig.js';
import ArcLayerDescriptor from './layer/arclayerdescriptor.js';
import ArcTileLayerConfig from './layer/arctilelayerconfig.js';
import {registerMimeTypes} from './mime.js';
import * as arcstate from './state/v2/arcstate.js';


/**
 * Plugin for arc server support in opensphere.
 */
class ArcPlugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = arc.ID;
  }

  /**
   * @inheritDoc
   */
  init() {
    registerMimeTypes();

    var dm = DataManager.getInstance();
    var arcEntry = new ProviderEntry(this.id, ArcServer, 'Arc Server',
        'Arc servers provide feature and tile data.');

    dm.registerProviderType(arcEntry);
    dm.registerDescriptorType(this.id, ArcLayerDescriptor);

    var lcm = LayerConfigManager.getInstance();
    lcm.registerLayerConfig(ArcFeatureLayerConfig.ID, ArcFeatureLayerConfig);
    lcm.registerLayerConfig(ArcTileLayerConfig.ID, ArcTileLayerConfig);
    lcm.registerLayerConfig(ArcImageLayerConfig.ID, ArcImageLayerConfig);

    var im = ImportManager.getInstance();
    im.registerImportUI(this.id, new ProviderImportUI(`<${arcImportEl}></${arcImportEl}>`));
    im.registerServerType(this.id, {
      type: 'arc',
      helpUi: ArcServerHelpUI.directiveTag,
      formUi: ArcImportForm.directiveTag,
      label: 'ArcGIS Server'
    });

    var sm = StateManager.getInstance();
    sm.addLoadFunction(arcstate.load);
    sm.addSaveFunction(arcstate.save);

    // Register a default validator to detect Arc server exceptions.
    net.registerDefaultValidator(arc.getException);

    // Set the base class for loading an Arc server.
    arc.setLoaderClass(ArcLoader);
  }
}

export default ArcPlugin;
