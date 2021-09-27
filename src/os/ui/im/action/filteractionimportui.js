goog.declareModuleId('os.ui.im.action.FilterActionImportUI');

import FilterImportUI from '../../filter/im/filterimportui.js';
import {directiveTag as importUi} from './filteractionimport.js';

const ImportActionManager = goog.require('os.im.action.ImportActionManager');


/**
 * Filter action import UI.
 */
export default class FilterActionImportUI extends FilterImportUI {
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
