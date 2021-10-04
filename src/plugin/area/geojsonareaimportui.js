goog.declareModuleId('plugin.area.GeoJSONAreaImportUI');

import AreaOptionsStep from '../../os/query/ui/areaoptionsstep.js';
import FileImportUI from '../../os/ui/im/fileimportui.js';
import * as osWindow from '../../os/ui/window.js';
import windowSelector from '../../os/ui/windowselector.js';
import GeoJSONParserConfig from '../file/geojsonparserconfig.js';
import {directiveTag as areaImportUi} from './geojsonareaimport.js';


/**
 * @extends {FileImportUI<GeoJSONParserConfig>}
 */
class GeoJSONAreaImportUI extends FileImportUI {
  /**
   * Constructor.
   */
  constructor() {
    super();

    // file contents are only used in memory, not loaded from storage
    this.requiresStorage = false;
  }

  /**
   * @inheritDoc
   */
  getTitle() {
    return 'Area Import - GeoJSON';
  }

  /**
   * @inheritDoc
   */
  launchUI(file, opt_config) {
    super.launchUI(file, opt_config);
    var steps = [
      new AreaOptionsStep()
    ];

    var config = new GeoJSONParserConfig();

    // if a configuration was provided, merge it in
    if (opt_config) {
      this.mergeConfig(opt_config, config);
    }

    config['file'] = file;
    config['title'] = file.getFileName();

    var scopeOptions = {
      'config': config,
      'steps': steps
    };
    var windowOptions = {
      'label': 'GeoJSON Area Import',
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
    var template = `<${areaImportUi} resize-with="${windowSelector.WINDOW}"></${areaImportUi}>`;
    osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
}

export default GeoJSONAreaImportUI;
