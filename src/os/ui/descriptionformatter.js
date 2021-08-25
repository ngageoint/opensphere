goog.module('os.ui.formatter.DescriptionFormatter');
goog.module.declareLegacyNamespace();

const SlickDescriptionAsyncRenderer = goog.require('os.ui.SlickDescriptionAsyncRenderer');

const SlickTreeNode = goog.requireType('os.ui.slick.SlickTreeNode');


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
const DescriptionFormatter = function(row, cell, value, columnDef, node) {
  if (!value || typeof value !== 'string') {
    return '';
  }
  columnDef['asyncPostRender'] = SlickDescriptionAsyncRenderer;
  return '<div class="location-properties-link">Show</div>';
};

exports = DescriptionFormatter;
