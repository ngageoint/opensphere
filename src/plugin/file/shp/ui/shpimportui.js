goog.declareModuleId('plugin.file.shp.ui.SHPImportUI');

import FileImportUI from '../../../../os/ui/im/fileimportui.js';
import * as osWindow from '../../../../os/ui/window.js';
import windowSelector from '../../../../os/ui/windowselector.js';
import OptionsStep from '../../../../os/ui/wiz/optionsstep.js';
import TimeStep from '../../../../os/ui/wiz/step/timestep.js';
import * as mime from '../mime.js';
import SHPParserConfig from '../shpparserconfig.js';
import SHPFilesStep from './shpfilesstep.js';
import {directiveTag as shpImportUi} from './shpimport.js';

/**
 * @extends {FileImportUI<SHPParserConfig>}
 */
export default class SHPImportUI extends FileImportUI {
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
    return 'SHP';
  }

  /**
   * @inheritDoc
   */
  launchUI(file, opt_config) {
    super.launchUI(file, opt_config);

    var steps = [
      new SHPFilesStep(),
      new TimeStep(),
      new OptionsStep()
    ];

    var config = new SHPParserConfig();

    // if a configuration was provided, merge it in
    if (opt_config) {
      this.mergeConfig(opt_config, config);
    }

    // determine if the initial file is the DBF or SHP file
    var name = file.getFileName();
    if (mime.SHP_EXT_REGEXP.test(name)) {
      config['file'] = file;
      config['title'] = name;
    } else {
      config['file2'] = file;
      config['title'] = name.split(mime.DBF_EXT_REGEXP)[0] + '.shp';
    }

    var scopeOptions = {
      'config': config,
      'steps': steps
    };
    var windowOptions = {
      'label': 'SHP Import',
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
    var template = `<${shpImportUi} resize-with="${windowSelector.WINDOW}"></${shpImportUi}>`;
    osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
}
