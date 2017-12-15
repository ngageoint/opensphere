goog.provide('os.ui.column.mapping.ColumnMappingExportCtrl');
goog.provide('os.ui.column.mapping.columnMappingExportDirective');
goog.require('os.column.ColumnMappingTypeMethod');
goog.require('os.file.persist.FilePersistence');
goog.require('os.ui.Module');


/**
 * The columnmappingexport directive
 * @return {angular.Directive}
 */
os.ui.column.mapping.columnMappingExportDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/column/mapping/columnmappingexport.html',
    controller: os.ui.column.mapping.ColumnMappingExportCtrl,
    controllerAs: 'cmExportCtrl'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('columnmappingexport', [os.ui.column.mapping.columnMappingExportDirective]);



/**
 * Controller function for the columnmappingexport directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.column.mapping.ColumnMappingExportCtrl = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;

  /**
   * @type {Array<os.column.IColumnMapping>}
   * @private
   */
  this.mappings_ = $scope['mappings'];

  /**
   * @type {Array<os.column.IColumnMapping>}
   * @private
   */
  this.selectedMappings_ = $scope['selectedMappings'];

  /**
   * @type {boolean}
   */
  this['showExportType'] = this.selectedMappings_.length > 0;

  /**
   * @type {string}
   */
  this['exportType'] = 'all';

  /**
   * @type {os.ex.IPersistenceMethod}
   */
  this['persister'] = null;

  /**
   * @type {Object.<string, os.ex.IPersistenceMethod>}
   */
  this['persisters'] = os.ui.column.mapping.ColumnMappingExportCtrl.persisters;

  // manually add persisters instead of going to the manager
  var filePersister = new os.file.persist.FilePersistence();
  // var urlPersister = new os.ui.file.persist.URLPersistence();
  this['persisters'][filePersister.getLabel()] = filePersister;
  // this['persisters'][urlPersister.getLabel()] = urlPersister;
  this['persister'] = filePersister;

  $scope.$on('$destroy', this.onDestroy_.bind(this));
};


/**
 * @type {Object<string, !os.ex.IPersistenceMethod>}
 */
os.ui.column.mapping.ColumnMappingExportCtrl.persisters = {
};


/**
 * Clean up.
 * @private
 */
os.ui.column.mapping.ColumnMappingExportCtrl.prototype.onDestroy_ = function() {
  this.scope_ = null;
  this.element_ = null;
};


/**
 * Exports the mappings.
 */
os.ui.column.mapping.ColumnMappingExportCtrl.prototype.accept = function() {
  var method = this['persister'];
  var title = /** @type {string} */ (this.scope_['title'] + '.xml');
  var mappings = this['exportType'] === 'all' ? this.mappings_ : this.selectedMappings_;

  var content = '<' + os.column.ColumnMappingTag.COLUMN_MAPPINGS + '>';
  for (var i = 0, ii = mappings.length; i < ii; i++) {
    content += mappings[i].writeMapping();
  }
  content += '</' + os.column.ColumnMappingTag.COLUMN_MAPPINGS + '>';

  method.save(title, content, os.column.ColumnMappingTypeMethod.CONTENT_TYPE);
  this.close();
};
goog.exportProperty(
    os.ui.column.mapping.ColumnMappingExportCtrl.prototype,
    'accept',
    os.ui.column.mapping.ColumnMappingExportCtrl.prototype.accept);


/**
 * Close the window
 */
os.ui.column.mapping.ColumnMappingExportCtrl.prototype.close = function() {
  os.ui.window.close(this.element_);
};
goog.exportProperty(
    os.ui.column.mapping.ColumnMappingExportCtrl.prototype,
    'close',
    os.ui.column.mapping.ColumnMappingExportCtrl.prototype.close);
