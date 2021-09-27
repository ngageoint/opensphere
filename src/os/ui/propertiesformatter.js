goog.declareModuleId('os.ui.formatter.PropertiesFormatter');

import SlickPropertiesAsyncRenderer from './slickpropertiesasyncrenderer.js';

const {default: SlickTreeNode} = goog.requireType('os.ui.slick.SlickTreeNode');


/**
 * Formats the source column
 *
 * @param {number} row The row number
 * @param {number} cell The cell number in the row
 * @param {*} value The value
 * @param {Object} columnDef The column definition
 * @param {SlickTreeNode} node The node
 * @return {string} The HTML for the cell
 */
const PropertiesFormatter = function(row, cell, value, columnDef, node) {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    return /** @type {string} */ (value);
  }
  columnDef['asyncPostRender'] = SlickPropertiesAsyncRenderer;
  return '<div class="btn btn-link">Show Properties</div>';
};

export default PropertiesFormatter;
