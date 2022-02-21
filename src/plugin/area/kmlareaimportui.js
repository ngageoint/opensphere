goog.declareModuleId('plugin.area.KMLAreaImportUI');

import EventType from '../../os/events/eventtype.js';
import FileParserConfig from '../../os/parse/fileparserconfig.js';
import FileImportUI from '../../os/ui/im/fileimportui.js';
import * as osWindow from '../../os/ui/window.js';
import KMLAreaParser from './kmlareaparser.js';
import {directiveTag as areaImportUi} from './kmlareaui.js';

const dispose = goog.require('goog.dispose');


/**
 */
class KMLAreaImportUI extends FileImportUI {
  /**
   * Constructor.
   */
  constructor() {
    super();

    // file contents are only used in memory, not loaded from storage
    this.requiresStorage = false;

    /**
     * @type {?string}
     * @protected
     */
    this.fileName = '';
  }

  /**
   * @inheritDoc
   */
  getTitle() {
    return 'Area Import - KML';
  }

  /**
   * @inheritDoc
   */
  launchUI(file, opt_config) {
    super.launchUI(file, opt_config);

    var config = new FileParserConfig();
    config['file'] = file;
    config['title'] = file.getFileName() || '';

    var callback = goog.partial(this.onPreviewReady_, config);
    var parser = new KMLAreaParser();
    parser.listenOnce(EventType.COMPLETE, callback, false, this);
    parser.listenOnce(EventType.ERROR, callback, false, this);
    parser.setSource(file.getContent());
  }

  /**
   * @param {FileParserConfig} config
   * @param {goog.events.Event} event
   * @private
   */
  onPreviewReady_(config, event) {
    var parser = /** @type {KMLAreaParser} */ (event.target);
    var preview = parser.parseNext();
    var columns = parser.getColumns() || [];
    dispose(parser);

    config['columns'] = columns;
    config['preview'] = preview;

    var scopeOptions = {
      'config': config
    };
    var windowOptions = {
      'label': 'KML Area Import',
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
    var template = `<${areaImportUi}></${areaImportUi}>`;
    osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
}

export default KMLAreaImportUI;
