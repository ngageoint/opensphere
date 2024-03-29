goog.declareModuleId('plugin.xyz.XYZPlugin');

import LayerConfigManager from '../../os/layer/config/layerconfigmanager.js';
import AbstractPlugin from '../../os/plugin/abstractplugin.js';
import ImportManager from '../../os/ui/im/importmanager.js';
import ProviderImportUI from '../../os/ui/providerimportui.js';
import XYZLayerConfig from './xyzlayerconfig.js';
import * as XYZProviderHelpUI from './xyzproviderhelp.js';
import * as XYZImportForm from './xyzproviderimportform.js';


/**
 * Provides map layer support
 */
export default class XYZPlugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = 'xyz';
  }

  /**
   * @inheritDoc
   */
  init() {
    var lcm = LayerConfigManager.getInstance();
    lcm.registerLayerConfig('XYZ', XYZLayerConfig);

    var im = ImportManager.getInstance();
    im.registerImportUI(this.id, new ProviderImportUI('<xyzprovider></xyzprovider>'));
    im.registerServerType(this.id, {
      type: 'xyz',
      helpUi: XYZProviderHelpUI.directiveTag,
      formUi: XYZImportForm.directiveTag,
      label: 'XYZ Map Layer'
    });
  }
}
