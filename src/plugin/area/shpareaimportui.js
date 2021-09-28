goog.declareModuleId('plugin.area.SHPAreaImportUI');

import * as mime from '../file/shp/mime.js';
import SHPParserConfig from '../file/shp/shpparserconfig.js';
import {directiveTag as areaImportUi} from './shpareaui.js';

const FileImportUI = goog.require('os.ui.im.FileImportUI');
const osWindow = goog.require('os.ui.window');
const windowSelector = goog.require('os.ui.windowSelector');


/**
 * @extends {FileImportUI<SHPParserConfig>}
 */
class SHPAreaImportUI extends FileImportUI {
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
    return 'Area Import - SHP';
  }

  /**
   * @inheritDoc
   */
  launchUI(file, opt_config) {
    super.launchUI(file, opt_config);

    var config = new SHPParserConfig();

    // determine if the initial file is the DBF or SHP file
    var name = file.getFileName();
    if (mime.SHP_EXT_REGEXP.test(name)) {
      config['file'] = file;
      config['title'] = name;
    } else if (mime.DBF_EXT_REGEXP.test(name)) {
      config['file2'] = file;
      config['title'] = name.split(mime.DBF_EXT_REGEXP)[0] + '.shp';
    } else {
      config['zipFile'] = file;
      config['title'] = name;
    }

    var scopeOptions = {
      'config': config
    };
    var windowOptions = {
      'label': 'SHP Area Import',
      'icon': 'fa fa-sign-in',
      'x': 'center',
      'y': 'center',
      'width': '450',
      'min-width': '300',
      'max-width': '800',
      'height': 'auto',
      'modal': 'true',
      'show-close': 'true'
    };
    var template = `<${areaImportUi} resize-with="${windowSelector.WINDOW}"></${areaImportUi}>`;
    osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
}

export default SHPAreaImportUI;
