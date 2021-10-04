goog.declareModuleId('os.ui.slick.asyncrenderer.slickColActAsyncRenderer');

import ColumnActionManager from '../columnactions/columnactionmanager.js';
import launchColumnActionPrompt from '../columnactions/launchcolumnactionprompt.js';
import SlickColumnActionModel from './slickcolumnactionmodel.js';


/**
 * @param {Object} node
 * @param {Object} elem
 * @param {number} row
 * @param {Object} dataContext
 * @param {Object} colDef
 */
const slickColActAsyncRenderer = function(node, elem, row, dataContext, colDef) {
  var $elem = $(elem);
  var $formatted = $elem.find('.col-act-mult');
  if ($formatted.length > 0) {
    var value = $formatted.data()['colvalue'];
    $formatted.on('click', goog.partial(openDialog, value, colDef, {'sourceId': node['sourceId']}));
  }
};

/**
 * @param {string} value
 * @param {Object} colDef
 * @param {?Object<string, *>} colActContext
 * @param {Object} node
 */
const openDialog = function(value, colDef, colActContext, node) {
  if (colActContext == null) {
    colActContext = {};
  }
  var col = new SlickColumnActionModel(colDef, node['value']);
  var matched = ColumnActionManager.getInstance().getActions(colActContext, col, value);
  launchColumnActionPrompt(matched, value, col);
};

export default slickColActAsyncRenderer;
