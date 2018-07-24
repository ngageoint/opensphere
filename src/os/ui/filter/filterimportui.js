goog.provide('os.ui.filter.FilterImportUI');
goog.require('os.ui.filter.im.filterImportDirective');
goog.require('os.ui.im.FileImportUI');



/**
 * @extends {os.ui.im.FileImportUI}
 * @constructor
 */
os.ui.filter.FilterImportUI = function() {
  os.ui.filter.FilterImportUI.base(this, 'constructor');

  /**
   * The import window label.
   * @type {string}
   */
  this.label = 'Import Filters';

  // file contents are only used in memory, not loaded from storage
  this.requiresStorage = false;
};
goog.inherits(os.ui.filter.FilterImportUI, os.ui.im.FileImportUI);


/**
 * @inheritDoc
 */
os.ui.filter.FilterImportUI.prototype.launchUI = function(file, opt_config) {
  os.ui.filter.FilterImportUI.base(this, 'launchUI', file, opt_config);

  var windowOptions = {
    'label': this.label,
    'icon': 'fa fa-sign-in',
    'x': 'center',
    'y': 'center',
    'width': '700',
    'min-width': '500',
    'max-width': '900',
    'height': '600',
    'min-height': '300',
    'max-height': '700',
    'modal': 'true',
    'show-close': 'true'
  };

  var layerId;
  if (opt_config) {
    layerId = opt_config['layerId'];
  }

  var scopeOptions = {
    'filterData': file.getContent(),
    'layerId': layerId
  };

  var template = this.getTemplate();
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};


/**
 * Gets the template for this UI.
 * @return {!string}
 * @protected
 */
os.ui.filter.FilterImportUI.prototype.getTemplate = function() {
  return '<filterimport filter-data="filterData" layer-id="layerId"></filterimport>';
};
