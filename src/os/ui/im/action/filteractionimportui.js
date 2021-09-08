goog.module('os.ui.im.action.FilterActionImportUI');

const ImportActionManager = goog.require('os.im.action.ImportActionManager');
const FilterImportUI = goog.require('os.ui.filter.im.FilterImportUI');
const {directiveTag: importUi} = goog.require('os.ui.im.action.FilterActionImport');


/**
 * Filter action import UI.
 */
class FilterActionImportUI extends FilterImportUI {
  /**
   * Constructor.
   */
  constructor() {
    super();

    const iam = ImportActionManager.getInstance();
    this.label = 'Import ' + iam.entryTitle + 's';
  }

  /**
   * @inheritDoc
   */
  getTemplate() {
    return `<${importUi} filter-data="filterData" layer-id="layerId"></${importUi}>`;
  }
}

exports = FilterActionImportUI;
