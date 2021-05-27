goog.module('plugin.area.KMLAreaImportUI');
goog.module.declareLegacyNamespace();

const FileParserConfig = goog.require('os.parse.FileParserConfig');
const FileImportUI = goog.require('os.ui.im.FileImportUI');
const KMLAreaParser = goog.require('plugin.area.KMLAreaParser');
const {directiveTag: areaImportUi} = goog.require('plugin.area.KMLAreaUI');


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
    parser.listenOnce(os.events.EventType.COMPLETE, callback, false, this);
    parser.listenOnce(os.events.EventType.ERROR, callback, false, this);
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
    goog.dispose(parser);

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
    os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
}

exports = KMLAreaImportUI;
