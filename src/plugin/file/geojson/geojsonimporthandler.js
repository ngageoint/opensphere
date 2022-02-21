goog.declareModuleId('plugin.file.geojson.GeoJSONImportHandler');

import DataManager from '../../../os/data/datamanager.js';
import FileDescriptor from '../../../os/data/filedescriptor.js';
import MappingManager from '../../../os/im/mapping/mappingmanager.js';
import FileImportUI from '../../../os/ui/im/fileimportui.js';
import GeoJSONParserConfig from '../geojsonparserconfig.js';
import GeoJSONDescriptor from './geojsondescriptor.js';
import GeoJSONProvider from './geojsonprovider.js';


/**
 * Import handler for GeoJSON. Skips showing a UI and just uses the default autodetected time mappings.
 * @extends {FileImportUI<GeoJSONParserConfig>}
 */
export default class GeoJSONImportHandler extends FileImportUI {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  getTitle() {
    return 'GeoJSONHandler';
  }

  /**
   * @inheritDoc
   */
  launchUI(file, opt_config) {
    const config = new GeoJSONParserConfig();

    // if a configuration was provided, merge it in
    if (opt_config) {
      this.mergeConfig(opt_config, config);
    }

    config['file'] = file;
    config['title'] = file.getFileName() || 'New GeoJSON File';

    try {
      config.updatePreview();

      const features = config['preview'].slice(0, 24);
      if ((!config['mappings'] || config['mappings'].length <= 0) && features && features.length > 0) {
        // no mappings have been set yet, so try to auto detect them
        const mm = MappingManager.getInstance();
        const mappings = mm.autoDetect(features);
        if (mappings && mappings.length > 0) {
          config['mappings'] = mappings;
        }
      }
    } catch (e) {
    }

    // create the descriptor and add it
    const provider = GeoJSONProvider.getInstance();
    const descriptor = new GeoJSONDescriptor(config);
    FileDescriptor.createFromConfig(descriptor, provider, config);

    provider.addDescriptor(descriptor);
    DataManager.getInstance().addDescriptor(descriptor);
    descriptor.setActive(true);
  }

  /**
   * @inheritDoc
   */
  mergeConfig(from, to) {
    super.mergeConfig(from, to);
    to['id'] = from['id'];
    to['keepUrl'] = from['keepUrl'];
  }
}
