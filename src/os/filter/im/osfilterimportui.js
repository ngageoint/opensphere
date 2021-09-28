goog.declareModuleId('os.filter.im.OSFilterImportUI');

import FilterImportUI from '../../ui/filter/im/filterimportui.js';
import {directiveTag as filterImportUi} from './osfilterimport.js';


/**
 */
export default class OSFilterImportUI extends FilterImportUI {
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
