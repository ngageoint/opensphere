goog.module('os.filter.im.OSFilterImportUI');

const {directiveTag: filterImportUi} = goog.require('os.filter.im.OSFilterImport');
const FilterImportUI = goog.require('os.ui.filter.im.FilterImportUI');


/**
 */
class OSFilterImportUI extends FilterImportUI {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  getTemplate() {
    return `<${filterImportUi} class="flex-column d-flex flex-fill" filter-data="filterData" ` +
        `layer-id="layerId"></${filterImportUi}>`;
  }
}

exports = OSFilterImportUI;
