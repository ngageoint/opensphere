goog.provide('os.ui.file.ExportDialogCtrl');
goog.provide('os.ui.file.exportDialogDirective');
goog.require('goog.asserts');
goog.require('os.ex.ExportOptions');
goog.require('os.ui.Module');
goog.require('os.ui.window');


/**
 * The exportdialog directive
 * @return {angular.Directive}
 */
os.ui.file.exportDialogDirective = function() {
  return {
    restrict: 'E',
    templateUrl: os.ROOT + 'views/file/exportdialog.html',
    controller: os.ui.file.ExportDialogCtrl,
    controllerAs: 'exportdialog'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('exportdialog', [os.ui.file.exportDialogDirective]);



/**
 * Controller function for the exportdialog directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$compile} $compile
 * @constructor
 * @ngInject
 * @template T
 */
os.ui.file.ExportDialogCtrl = function($scope, $element, $compile) {
  /**
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;

  // how data items will be referenced in the UI - replace this in an extending class if the application has its own
  // terminology (ie, 'features' or 'records')
  $scope['itemText'] = 'item';

  /**
   * @type {?angular.JQLite}
   * @protected
   */
  this.element = $element;

  /**
   * @type {?angular.$compile}
   * @protected
   */
  this.compile = $compile;

  /**
   * @type {os.ex.ExportOptions.<T>}
   * @protected
   */
  this.options = /** @type {os.ex.ExportOptions.<T>} */ (this.scope['options']);

  /**
   * @type {Object.<string, os.ex.IExportMethod>}
   */
  this['exporters'] = {};

  $scope['exporter'] = this.options.exporter;
  $scope['initialExporter'] = !!$scope['exporter'];
  if (!$scope['exporter']) {
    var exporters = os.ui.exportManager.getExportMethods();
    if (exporters && exporters.length > 0) {
      $scope['exporter'] = exporters[0];

      for (var i = 0, n = exporters.length; i < n; i++) {
        this['exporters'][exporters[i].getLabel()] = exporters[i];
      }
    }
  }

  /**
   * @type {Object.<string, os.ex.IPersistenceMethod>}
   */
  this['persisters'] = {};

  $scope['persister'] = this.options.persister;
  $scope['initialPersister'] = !!$scope['persister'];
  if (!$scope['persister']) {
    var persisters = os.ui.exportManager.getPersistenceMethods();
    if (persisters && persisters.length > 0) {
      $scope['persister'] = persisters[0];

      for (var i = 0, n = persisters.length; i < n; i++) {
        this['persisters'][persisters[i].getLabel()] = persisters[i];
      }
    }
  }

  // add application-specific UI
  var customContainer = this.element.find('.custom-ui');
  var customOptions = this.getCustomOptions();
  if (customOptions) {
    customContainer.html(customOptions);
    this.compile(customContainer.contents())(this.scope);
  } else {
    customContainer.remove();
  }

  $scope.$emit('window.ready');
  $scope.$watch('exporter', this.onExporterChange.bind(this));
  $scope.$watch('persister', this.onPersisterChange.bind(this));
  $scope.$on('$destroy', this.destroy.bind(this));
};


/**
 * Clean up.
 * @protected
 */
os.ui.file.ExportDialogCtrl.prototype.destroy = function() {
  this.scope = null;
  this.element = null;
  this.compile = null;
};


/**
 * Get the label for the exporter.
 * @return {?string}
 */
os.ui.file.ExportDialogCtrl.prototype.getExporterLabel = function() {
  if (this.scope && this.scope['exporter']) {
    return this.scope['exporter'].getLabel();
  }

  return null;
};
goog.exportProperty(
    os.ui.file.ExportDialogCtrl.prototype,
    'getExporterLabel',
    os.ui.file.ExportDialogCtrl.prototype.getExporterLabel);


/**
 * Get the options UI for the exporter.
 * @return {?string}
 */
os.ui.file.ExportDialogCtrl.prototype.getExporterUI = function() {
  if (this.scope && this.scope['exporter']) {
    return this.scope['exporter'].getUI();
  }

  return null;
};
goog.exportProperty(
    os.ui.file.ExportDialogCtrl.prototype,
    'getExporterUI',
    os.ui.file.ExportDialogCtrl.prototype.getExporterUI);


/**
 * Extending classes can use this to provide their own options in the form.
 * @return {?string} The custom options UI as HTML
 * @protected
 */
os.ui.file.ExportDialogCtrl.prototype.getCustomOptions = function() {
  return null;
};


/**
 * Handle exporter change.
 * @param {os.ex.IExportMethod=} opt_new The new value
 * @param {os.ex.IExportMethod=} opt_old The old value
 * @protected
 */
os.ui.file.ExportDialogCtrl.prototype.onExporterChange = function(opt_new, opt_old) {
  if (opt_new) {
    this.options.exporter = opt_new;

    // remove the old export ui
    var uiContainer = this.element.find('.export-ui-container');
    uiContainer.children().remove();

    // and drop in the new one
    var ui = opt_new.getUI();
    if (ui && this.scope) {
      uiContainer.html(ui);
      this.compile(uiContainer.contents())(this.scope);
    }
  }
};


/**
 * Handle exporter change.
 * @param {os.ex.IPersistenceMethod=} opt_new The new value
 * @param {os.ex.IPersistenceMethod=} opt_old The old value
 * @protected
 */
os.ui.file.ExportDialogCtrl.prototype.onPersisterChange = function(opt_new, opt_old) {
  if (opt_new) {
    this.options.persister = opt_new;
  }
};


/**
 * Fire the cancel callback and close the window.
 */
os.ui.file.ExportDialogCtrl.prototype.cancel = function() {
  this.close_();
};
goog.exportProperty(
    os.ui.file.ExportDialogCtrl.prototype,
    'cancel',
    os.ui.file.ExportDialogCtrl.prototype.cancel);


/**
 * Fire the confirmation callback and close the window.
 */
os.ui.file.ExportDialogCtrl.prototype.confirm = function() {
  goog.asserts.assert(goog.isDefAndNotNull(this.options.exporter), 'exporter is not defined');
  goog.asserts.assert(goog.isDefAndNotNull(this.options.persister), 'persister is not defined');
  goog.asserts.assert(goog.isDefAndNotNull(this.options.title), 'export title is null');
  goog.asserts.assert(this.options.items.length > 0, 'no items to export');
  goog.asserts.assert(this.options.fields.length > 0, 'no fields defined on export');

  os.ui.exportManager.exportItems(this.options.items, this.options.fields, this.options.title,
      this.options.exporter, this.options.persister);
  this.close_();
};
goog.exportProperty(
    os.ui.file.ExportDialogCtrl.prototype,
    'confirm',
    os.ui.file.ExportDialogCtrl.prototype.confirm);


/**
 * Close the window.
 * @private
 */
os.ui.file.ExportDialogCtrl.prototype.close_ = function() {
  os.ui.window.close(this.element);
};
