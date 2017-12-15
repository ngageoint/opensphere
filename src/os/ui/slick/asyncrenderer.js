goog.provide('os.ui.slick.asyncrenderer.slickColActAsyncRenderer');
goog.require('os.ui.columnactions.ColumnActionEvent');
goog.require('os.ui.columnactions.ColumnActionManager');
goog.require('os.ui.slick.SlickColumnActionModel');


/**
 * @param {Object} node
 * @param {Object} elem
 * @param {number} row
 * @param {Object} dataContext
 * @param {Object} colDef
 */
os.ui.slick.asyncrenderer.slickColActAsyncRenderer = function(node, elem, row, dataContext, colDef) {
  var $elem = $(elem);
  var $formatted = $elem.find('.col-act-mult');
  if ($formatted.length > 0) {
    var value = $formatted.data()['colvalue'];
    $formatted.click(goog.partial(os.ui.slick.asyncrenderer.openDialog, value, colDef,
        {'sourceId': node['sourceId']}));
  }
};


/**
 * @param {string} value
 * @param {Object} colDef
 * @param {?Object.<string, *>} colActContext
 * @param {Object} node
 */
os.ui.slick.asyncrenderer.openDialog = function(value, colDef, colActContext, node) {
  if (!goog.isDefAndNotNull(colActContext)) {
    colActContext = {};
  }
  var col = new os.ui.slick.SlickColumnActionModel(colDef, node['value']);
  var matched = os.ui.columnactions.ColumnActionManager.getInstance().getActions(colActContext, col, value);
  os.ui.columnactions.launchColumnActionPrompt(matched, value, col);
};
