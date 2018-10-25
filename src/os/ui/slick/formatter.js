goog.provide('os.ui.slick.formatter');

goog.require('goog.string');
goog.require('os.ui');
goog.require('os.ui.columnactions.ColumnActionEvent');
goog.require('os.ui.columnactions.ColumnActionManager');
goog.require('os.ui.formatter');
goog.require('os.ui.slick.SlickColumnActionModel');
goog.require('os.ui.slick.asyncrenderer.slickColActAsyncRenderer');
goog.require('os.url');


/**
 * Generic formatter
 * @param {number} row The row number
 * @param {number} cell The cell number in the row
 * @param {string} value The value
 * @param {Object} columnDef The column definition
 * @param {os.ui.slick.SlickTreeNode} node The node
 * @return {string} The HTML for the cell
 */
os.ui.slick.formatter.columnFormatter = function(row, cell, value, columnDef, node) {
  if (!value) {
    return '';
  }
  return value;
};


/**
 * Generic formatter for reading a string field separated by dots, i.e: "a.b.c" will read row[a][b][c];
 * @param {number} row The row number
 * @param {number} cell The cell number in the row
 * @param {string} value The value
 * @param {Object} columnDef The column definition
 * @param {os.ui.slick.SlickTreeNode} node The node
 * @return {string} The HTML for the cell
 */
os.ui.slick.formatter.depthfulFormatter = function(row, cell, value, columnDef, node) {
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
 * @param {number} row Row in the grid
 * @param {number} cell Cell in the row
 * @param {string} value Data value (color as hex or rgba)
 * @param {os.data.ColumnDefinition} columnDef The column definition
 * @param {Object} item The item
 * @return {string} A dot colored based on the cell content
 */
os.ui.slick.formatter.color = function(row, cell, value, columnDef, item) {
  return value ? '<i class="fa fa-circle" style="color:' + value + '"></i>' :
      '<i class="fa fa-adjust c-formatter__adjust" title="Multiple Colors Present"></i>';
};


/**
 * Formats a column with fixed row numbers
 * @param {number} row The row number
 * @param {number} cell The cell number in the row
 * @param {string} value The value
 * @param {Object} columnDef The column definition
 * @param {Object} item The item
 * @return {number} The row number
 */
os.ui.slick.formatter.rowNumber = function(row, cell, value, columnDef, item) {
  return row + 1;
};


/**
 * @type {RegExp}
 */
os.ui.slick.formatter.ANCHOR = /<a /;


/**
 * Formats the data to be a link if it passes the regex
 * @param {number} row The row number
 * @param {number} cell The cell number in the row
 * @param {string} value The value
 * @param {Object} columnDef The column definition
 * @param {os.ui.slick.SlickTreeNode} node The node
 * @param {os.ui.columnactions.ColumnActionFormatterFn=} opt_colFn Optional column action function. This will
 *        override the default one if provided.
 * @return {string} The HTML for the cell
 */
os.ui.slick.formatter.urlNewTabFormatter = function(row, cell, value, columnDef, node, opt_colFn) {
  value = os.ui.formatter.urlNewTabFormatter(value);

  var colFn = opt_colFn || os.ui.slick.formatter.columnActionFormatter;
  var colAct = colFn(row, cell, value, columnDef, node, true);

  return goog.string.buildString(value, colAct);
};


/**
 * Formats the source column
 * @param {number} row The row number
 * @param {number} cell The cell number in the row
 * @param {string} value The value
 * @param {Object} columnDef The column definition
 * @param {os.ui.slick.SlickTreeNode} node The node
 * @return {string} The HTML for the cell
 */
os.ui.slick.formatter.shortUrlFormatter = function(row, cell, value, columnDef, node) {
  if (!value) {
    return '';
  }

  var splitVal = value.split(' ');
  var newValue = '';
  var cite = 1;

  goog.array.forEach(splitVal, function(elem, index, arr) {
    if (os.url.URL_REGEXP.test(elem)) {
      var url = String(elem);
      elem = ['[', cite, ']'].join('').link(url)
          .replace('<a', goog.string.buildString('<a title="', url, '" target="', url, '" '));
      cite++;
    }

    newValue = newValue.concat(elem) + ' ';
  });

  return os.ui.sanitize(newValue.trim());
};


/**
 * Formats the source column
 * @param {number} row The row number
 * @param {number} cell The cell number in the row
 * @param {string} value The value
 * @param {Object} columnDef The column definition
 * @param {os.ui.slick.SlickTreeNode} node The node
 * @return {string} The HTML for the cell
 */
os.ui.slick.formatter.urlFormatter = function(row, cell, value, columnDef, node) {
  if (!value) {
    return '';
  }

  var splitVal = value.split(' ');
  var newValue = '';

  goog.array.forEach(splitVal, function(elem, index, arr) {
    if (os.url.URL_REGEXP.test(elem)) {
      var url = os.ui.sanitize(String(elem));
      elem = url.link(url).replace('<a', goog.string.buildString('<a title="', url, '" target="', url, '" '));
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
 * @param {os.ui.slick.SlickTreeNode} node The node
 * @param {boolean=} opt_asDecorator this formatter is being called by another formatter and will be use to decorate
 *  the output of the calling formatter.  Dont include the value in the output.
 * @return {string} The HTML for the cell
 */
os.ui.slick.formatter.columnActionFormatter = function(row, cell, value, columnDef, node, opt_asDecorator) {
  var formatted = '';
  if (opt_asDecorator !== true) {
    formatted = value;
  }
  var cam = os.ui.columnactions.ColumnActionManager.getInstance();

  var actions = cam.getActions(null, new os.ui.slick.SlickColumnActionModel(columnDef), value);
  if (actions.length === 1) {
    formatted = goog.string.buildString(formatted, ' <div ',
        'class="col-act col-act-single d-inline-block" data-colvalue="', value, '">',
        '<a class="os-colact-anchor" href="', actions[0].getAction(value), '" target="_blank">',
        '<i class="fa fa-external-link-square" title="', actions[0].getDescription(), '"></i></a></div>');
  } else if (actions.length > 1) {
    formatted = goog.string.buildString(formatted, ' <div ',
        'class="col-act col-act-mult d-inline-block" data-colvalue="', value, '">',
        '<span title="Multiple Column Actions" ',
        'class="fa-stack mult-colaction align-baseline">',
        '<i class="fa fa-square-o fa-stack-1x c-formatter__column-action-square"></i>',
        '<i class="fa fa-stack fa-external-link-square"></i></span></div>');
    columnDef['asyncPostRender'] = goog.partial(os.ui.slick.asyncrenderer.slickColActAsyncRenderer, node);
  }

  return formatted;
};


/**
 * Formats the source column
 * @param {number} row The row number
 * @param {number} cell The cell number in the row
 * @param {string} value The value
 * @param {Object} columnDef The column definition
 * @param {os.ui.slick.SlickTreeNode} node The node
 * @return {string} The HTML for the cell
 */
os.ui.slick.formatter.imgPreviewFormatter = function(row, cell, value, columnDef, node) {
  if (!value) {
    return '';
  }

  return goog.string.buildString('<img class="h-100" src="', value, '"/>');
};
