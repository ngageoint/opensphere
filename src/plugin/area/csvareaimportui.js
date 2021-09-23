goog.declareModuleId('plugin.area.CSVAreaImportUI');

const AreaOptionsStep = goog.require('os.query.ui.AreaOptionsStep');
const ConfigStep = goog.require('os.ui.file.ui.csv.ConfigStep');
const FileImportUI = goog.require('os.ui.im.FileImportUI');
const osWindow = goog.require('os.ui.window');
const windowSelector = goog.require('os.ui.windowSelector');
const GeometryStep = goog.require('os.ui.wiz.GeometryStep');
const {directiveTag: areaImportUi} = goog.require('plugin.area.CSVAreaImport');
const CSVParserConfig = goog.require('plugin.file.csv.CSVParserConfig');


/**
 * @extends {FileImportUI<CSVParserConfig>}
 */
class CSVAreaImportUI extends FileImportUI {
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
    return 'Area Import - CSV';
  }

  /**
   * @inheritDoc
   */
  launchUI(file, opt_config) {
    super.launchUI(file, opt_config);

    var steps = [
      new ConfigStep(),
      new GeometryStep(),
      new AreaOptionsStep()
    ];

    var config = new CSVParserConfig();
    config['file'] = file;
    config['title'] = file.getFileName();
    config.updateLinePreview();

    var scopeOptions = {
      'config': config,
      'steps': steps
    };
    var windowOptions = {
      'label': 'CSV Area Import',
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

export default CSVAreaImportUI;
