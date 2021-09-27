goog.declareModuleId('plugin.file.geojson.GeoJSONImportUI');

import FileImportUI from '../../../os/ui/im/fileimportui.js';
import * as osWindow from '../../../os/ui/window.js';
import windowSelector from '../../../os/ui/windowselector.js';
import OptionsStep from '../../../os/ui/wiz/optionsstep.js';
import TimeStep from '../../../os/ui/wiz/step/timestep.js';
import GeoJSONParserConfig from '../geojsonparserconfig.js';
import GeoJSONDescriptor from './geojsondescriptor.js';
import {directiveTag as geoJsonImportUi} from './geojsonimport.js';
import GeoJSONProvider from './geojsonprovider.js';

const DataManager = goog.require('os.data.DataManager');
const FileDescriptor = goog.require('os.data.FileDescriptor');
const MappingManager = goog.require('os.im.mapping.MappingManager');


/**
 * @extends {FileImportUI.<GeoJSONParserConfig>}
 */
export default class GeoJSONImportUI extends FileImportUI {
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
    return 'GeoJSON';
  }

  /**
   * @inheritDoc
   */
  launchUI(file, opt_config) {
    super.launchUI(file, opt_config);

    const config = new GeoJSONParserConfig();

    // if a configuration was provided, merge it in
    if (opt_config) {
      this.mergeConfig(opt_config, config);
    }

    config['file'] = file;
    config['title'] = file.getFileName();

    try {
      config.updatePreview();

      var features = config['preview'].slice(0, 24);
      if ((!config['mappings'] || config['mappings'].length <= 0) && features && features.length > 0) {
        // no mappings have been set yet, so try to auto detect them
        var mm = MappingManager.getInstance();
        var mappings = mm.autoDetect(features);
        if (mappings && mappings.length > 0) {
          config['mappings'] = mappings;
        }
      }
    } catch (e) {
    }

    if (opt_config && opt_config['defaultImport']) {
      this.handleDefaultImport(file, config);
      return;
    }

    const steps = [
      new TimeStep(),
      new OptionsStep()
    ];

    const scopeOptions = {
      'config': config,
      'steps': steps
    };
    const windowOptions = {
      'label': 'Import GeoJSON',
      'icon': 'fa fa-sign-in',
      'x': 'center',
      'y': 'center',
      'width': '850',
      'min-width': '500',
      'max-width': '1200',
      'height': '650',
      'min-height': '300',
      'max-height': '1000',
      'modal': 'true',
      'show-close': 'true'
    };
    var template = `<${geoJsonImportUi} resize-with="${windowSelector.WINDOW}"></${geoJsonImportUi}>`;
    osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }

  /**
   * @inheritDoc
   */
  handleDefaultImport(file, config) {
    config = this.getDefaultConfig(file, config);

    // create the descriptor and add it
    if (config) {
      const provider = GeoJSONProvider.getInstance();
      const descriptor = new GeoJSONDescriptor(config);
      FileDescriptor.createFromConfig(descriptor, provider, config);

      provider.addDescriptor(descriptor);
      DataManager.getInstance().addDescriptor(descriptor);
      descriptor.setActive(true);
    }
  }
}
