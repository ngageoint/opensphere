goog.declareModuleId('os.ui.slick.formatter');

import {URL_REGEXP} from '../../url/url.js';
import ColumnActionManager from '../columnactions/columnactionmanager.js';
import {ANCHOR as BASE_ANCHOR, urlNewTabFormatter as baseUrlNewTabFormatter} from '../formatter.js';
import * as ui from '../ui.js';
import slickColActAsyncRenderer from './asyncrenderer.js';
import SlickColumnActionModel from './slickcolumnactionmodel.js';

const {buildString, htmlEscape} = goog.require('goog.string');

const {default: ColumnDefinition} = goog.requireType('os.data.ColumnDefinition');
const {default: ColumnActionFormatterFn} = goog.requireType('os.ui.columnactions.ColumnActionFormatterFn');
const {default: SlickTreeNode} = goog.requireType('os.ui.slick.SlickTreeNode');


/**
 * Generic formatter
 *
 * @param {number} row The row number
 * @param {number} cell The cell number in the row
 * @param {string} value The value
 * @param {Object} columnDef The column definition
 * @param {SlickTreeNode} node The node
 * @return {string} The HTML for the cell
 */
export const columnFormatter = function(row, cell, value, columnDef, node) {
  if (!value) {
    return '';
  }
  return value;
};

/**
 * Generic formatter for reading a string field separated by dots, i.e: "a.b.c" will read row[a][b][c];
 *
 * @param {number} row The row number
 * @param {number} cell The cell number in the row
 * @param {string} value The value
 * @param {Object} columnDef The column definition
 * @param {SlickTreeNode} node The node
 * @return {string} The HTML for the cell
 */
export const depthfulFormatter = function(row, cell, value, columnDef, node) {
  var field = columnDef['field'];
  var fields = field.split('.');
  var val = node;
  try {
    for (var i = 0; i < fields.length; i++) {
      val = val[fields[i]];
    }
  } catch (e) {
    val = '';
  }

  return val || '';
};

/**
 * Formats a column to display a dot colored by the cell's value. Cell value should either be a hex or rgba string.
 *
 * @param {number} row Row in the grid
 * @param {number} cell Cell in the row
 * @param {string} value Data value (color as hex or rgba)
 * @param {ColumnDefinition} columnDef The column definition
 * @param {Object} item The item
 * @return {string} A dot colored based on the cell content
 */
export const color = function(row, cell, value, columnDef, item) {
  return value ? '<i class="fa fa-circle" style="color:' + value + '"></i>' :
    '<i class="fa fa-adjust c-formatter__adjust" title="Multiple Colors Present"></i>';
};

/**
 * Formats a column with fixed row numbers
 *
 * @param {number} row The row number
 * @param {number} cell The cell number in the row
 * @param {string} value The value
 * @param {Object} columnDef The column definition
 * @param {Object} item The item
 * @return {number} The row number
 */
export const rowNumber = function(row, cell, value, columnDef, item) {
  return row + 1;
};

/**
 * @type {RegExp}
 * @deprecated Please use os.ui.formatter.ANCHOR instead.
 */
export const ANCHOR = BASE_ANCHOR;

/**
 * Formats the data to be a link if it passes the regex
 *
 * @param {number} row The row number
 * @param {number} cell The cell number in the row
 * @param {string} value The value
 * @param {Object} columnDef The column definition
 * @param {SlickTreeNode} node The node
 * @param {ColumnActionFormatterFn=} opt_colFn Optional column action function. This will
 *        override the default one if provided.
 * @return {string} The HTML for the cell
 */
export const urlNewTabFormatter = function(row, cell, value, columnDef, node, opt_colFn) {
  value = baseUrlNewTabFormatter(value);

  var colFn = opt_colFn || columnActionFormatter;
  var colAct = colFn(row, cell, value, columnDef, node, true);

  return buildString(value, colAct);
};

/**
 * Formats the source column
 *
 * @param {number} row The row number
 * @param {number} cell The cell number in the row
 * @param {string} value The value
 * @param {Object} columnDef The column definition
 * @param {SlickTreeNode} node The node
 * @return {string} The HTML for the cell
 */
export const shortUrlFormatter = function(row, cell, value, columnDef, node) {
  if (!value) {
    return '';
  }

  var splitVal = value.split(' ');
  var newValue = '';
  var cite = 1;

  splitVal.forEach(function(elem, index, arr) {
    if (URL_REGEXP.test(elem)) {
      var url = String(elem);
      elem = ['[', cite, ']'].join('').link(url)
          .replace('<a', buildString('<a title="', url, '" target="', url, '" '));
      cite++;
    }

    newValue = newValue.concat(elem) + ' ';
  });

  return ui.sanitize(newValue.trim());
};

/**
 * Formats the source column
 *
 * @param {number} row The row number
 * @param {number} cell The cell number in the row
 * @param {string} value The value
 * @param {Object} columnDef The column definition
 * @param {SlickTreeNode} node The node
 * @return {string} The HTML for the cell
 */
export const urlFormatter = function(row, cell, value, columnDef, node) {
  if (!value) {
    return '';
  }

  var splitVal = value.split(' ');
  var newValue = '';

  splitVal.forEach(function(elem, index, arr) {
    if (URL_REGEXP.test(elem)) {
      var url = ui.sanitize(String(elem));
      elem = url.link(url).replace('<a', buildString('<a title="', url, '" target="', url, '" '));
    }

    newValue = newValue.concat(elem) + ' ';
  });

  return newValue.trim();
};

/**
 * @param {number} row The row number
 * @param {number} cell The cell number in the row
 * @param {string} value The value
 * @param {Object} columnDef The column definition
 * @param {SlickTreeNode} node The node
 * @param {boolean=} opt_asDecorator this formatter is being called by another formatter and will be use to decorate
 *  the output of the calling formatter.  Dont include the value in the output.
 * @return {string} The HTML for the cell
 */
export const columnActionFormatter = function(row, cell, value, columnDef, node, opt_asDecorator) {
  var formatted = '';
  if (opt_asDecorator !== true) {
    // escape the value or Slickgrid will attempt to render any valid HTML characters (and it will fail)
    formatted = htmlEscape(value);
  }
  var cam = ColumnActionManager.getInstance();

  var actions = cam.getActions(null, new SlickColumnActionModel(columnDef), value);
  if (actions.length === 1) {
    formatted = buildString(formatted, ' <div ',
        'class="col-act col-act-single d-inline-block" data-colvalue="', value, '">',
        '<a class="os-colact-anchor" href="', actions[0].getAction(value), '" target="_blank">',
        '<i class="fa fa-external-link-square" title="', actions[0].getDescription(), '"></i></a></div>');
  } else if (actions.length > 1) {
    formatted = buildString(formatted, ' <div ',
        'class="col-act col-act-mult d-inline-block" data-colvalue="', value, '">',
        '<span title="Multiple Column Actions" ',
        'class="fa-stack mult-colaction align-baseline">',
        '<i class="fa fa-square-o fa-stack-1x c-formatter__column-action-square"></i>',
        '<i class="fa fa-stack fa-external-link-square"></i></span></div>');
    columnDef['asyncPostRender'] = goog.partial(slickColActAsyncRenderer, node);
  }

  return formatted;
};

/**
 * Formats the source column
 *
 * @param {number} row The row number
 * @param {number} cell The cell number in the row
 * @param {string} value The value
 * @param {Object} columnDef The column definition
 * @param {SlickTreeNode} node The node
 * @return {string} The HTML for the cell
 */
export const imgPreviewFormatter = function(row, cell, value, columnDef, node) {
  if (!value) {
    return '';
  }

  return buildString('<img class="h-100" src="', value, '"/>');
};
