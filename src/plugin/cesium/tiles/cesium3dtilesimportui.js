goog.module('plugin.cesium.tiles.TilesetImportUI');

const FileImportUI = goog.require('os.ui.im.FileImportUI');
const osWindow = goog.require('os.ui.window');
const {TYPE} = goog.require('plugin.cesium.tiles');
const {directiveTag} = goog.require('plugin.cesium.tiles.TilesetImport');


/**
 * Import UI for 3D tiles.
 *
 * @extends {FileImportUI<Object>}
 */
class TilesetImportUI extends FileImportUI {
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

exports = TilesetImportUI;
