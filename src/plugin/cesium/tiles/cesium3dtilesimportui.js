goog.declareModuleId('plugin.cesium.tiles.TilesetImportUI');

import FileImportUI from '../../../os/ui/im/fileimportui.js';
import * as osWindow from '../../../os/ui/window.js';
import {TYPE} from './cesium3dtiles.js';
import {directiveTag} from './cesium3dtilesimport.js';

/**
 * Import UI for 3D tiles.
 *
 * @extends {FileImportUI<Object>}
 */
export default class TilesetImportUI extends FileImportUI {
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
    return TYPE;
  }

  /**
   * @inheritDoc
   */
  launchUI(file, opt_config) {
    var config = {};

    // if a configuration was provided, merge it in
    if (opt_config) {
      this.mergeConfig(opt_config, config);
    }

    config['file'] = file;
    config['title'] = 'New 3D Tile Layer';

    var scopeOptions = {
      'config': config
    };
    var windowOptions = {
      'label': 'Import ' + TYPE,
      'icon': 'fa fa-sign-in',
      'x': 'center',
      'y': 'center',
      'width': 400,
      'min-width': 400,
      'max-width': 800,
      'height': 'auto',
      'modal': true,
      'show-close': true
    };
    var template = `<${directiveTag}></${directiveTag}>`;
    osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
}
