goog.provide('os.filter.im.OSFilterImportUI');
goog.require('os.filter.im.osFilterImportDirective');
goog.require('os.ui.filter.FilterImportUI');



/**
 * @extends {os.ui.filter.FilterImportUI}
 * @constructor
 */
os.filter.im.OSFilterImportUI = function() {
  os.filter.im.OSFilterImportUI.base(this, 'constructor');
};
goog.inherits(os.filter.im.OSFilterImportUI, os.ui.filter.FilterImportUI);


/**
 * @inheritDoc
 */
os.filter.im.OSFilterImportUI.prototype.getTemplate = function() {
  return '<osfilterimport class="flex-column d-flex u-flex-grow" filter-data="filterData" ' +
    ' layer-id="layerId"></osfilterimport>';
};
