goog.declareModuleId('os.ui.im.action.FilterActionImportUI');

import ImportActionManager from '../../../im/action/importactionmanager.js';
import FilterImportUI from '../../filter/im/filterimportui.js';
import {directiveTag as importUi} from './filteractionimport.js';


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
