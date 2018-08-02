goog.provide('os.ui.im.action.FilterActionImportUI');

goog.require('os.ui.filter.FilterImportUI');
goog.require('os.ui.im.action.filterActionImportDirective');



/**
 * Filter action import UI.
 * @extends {os.ui.filter.FilterImportUI}
 * @constructor
 */
os.ui.im.action.FilterActionImportUI = function() {
  os.ui.im.action.FilterActionImportUI.base(this, 'constructor');
  var iam = os.im.action.ImportActionManager.getInstance();
  this.label = 'Import ' + iam.entryTitle + 's';
};
goog.inherits(os.ui.im.action.FilterActionImportUI, os.ui.filter.FilterImportUI);


/**
 * @inheritDoc
 */
os.ui.im.action.FilterActionImportUI.prototype.getTemplate = function() {
  return '<filteractionimport filter-data="filterData" layer-id="layerId"></filteractionimport>';
};
