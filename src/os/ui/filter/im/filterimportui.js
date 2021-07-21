goog.module('os.ui.filter.im.FilterImportUI');
goog.module.declareLegacyNamespace();

const {directiveTag: filterImportUi} = goog.require('os.ui.filter.im.FilterImport');
const FileImportUI = goog.require('os.ui.im.FileImportUI');
const osWindow = goog.require('os.ui.window');

/**
 */
class FilterImportUI extends FileImportUI {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * The import window label.
     * @type {string}
     */
    this.label = 'Import Filters';

    // file contents are only used in memory, not loaded from storage
    this.requiresStorage = false;
  }

  /**
   * @inheritDoc
   */
  getTitle() {
    return 'Filter Import - XML';
  }

  /**
   * @inheritDoc
   */
  launchUI(file, opt_config) {
    super.launchUI(file, opt_config);

    var windowOptions = {
      'label': this.label,
      'icon': 'fa fa-sign-in',
      'x': 'center',
      'y': 'center',
      'width': '700',
      'min-width': '500',
      'max-width': '900',
      'height': '600',
      'min-height': '300',
      'max-height': '700',
      'modal': 'true',
      'show-close': 'true'
    };

    var layerId;
    if (opt_config) {
      layerId = opt_config['layerId'];
    }

    var scopeOptions = {
      'filterData': file.getContent(),
      'layerId': layerId
    };

    var template = this.getTemplate();
    osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }

  /**
   * Gets the template for this UI.
   *
   * @return {!string}
   * @protected
   */
  getTemplate() {
    return `<${filterImportUi} filter-data="filterData" layer-id="layerId"></${filterImportUi}>`;
  }
}

exports = FilterImportUI;
