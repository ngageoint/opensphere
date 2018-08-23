goog.provide('os.ui.file.AnyTypeImportCtrl');
goog.provide('os.ui.file.anyTypeImportDirective');

goog.require('os.file.mime.zip');
goog.require('os.ui.im.ImportManager');
goog.require('os.ui.window');


/**
 * The KML import directive
 * @return {angular.Directive}
 */
os.ui.file.anyTypeImportDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/file/anytypeimport.html',
    controller: os.ui.file.AnyTypeImportCtrl,
    controllerAs: 'anytype'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('anytypeimport', [os.ui.file.anyTypeImportDirective]);



/**
 * Controller for the KML import dialog
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.file.AnyTypeImportCtrl = function($scope, $element) {
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

  this.scope_['isZip'] = this.scope_['file'] ? os.file.mime.zip.isZip(this.scope_['file'].getContent()) : false;

  this.scope_.$emit(os.ui.WindowEventType.READY);
  this.scope_.$on('destroy', goog.bind(function() {
    this.scope_ = null;
    this.element_ = null;
  }, this));
};


/**
 * Open the correct importer
 */
os.ui.file.AnyTypeImportCtrl.prototype.accept = function() {
  try {
    this.scope_['import'].launchUI(this.scope_['file'], this.scope_['config']);
  } catch (e) {
    os.alert.AlertManager.getInstance().sendAlert(
        'Error loading file: <b>' + this.scope_['file'].getFileName() + '</b>', os.alert.AlertEventSeverity.ERROR);
  }

  this.close();
};
goog.exportProperty(
    os.ui.file.AnyTypeImportCtrl.prototype,
    'accept',
    os.ui.file.AnyTypeImportCtrl.prototype.accept);


/**
 * Open the correct importer
 */
os.ui.file.AnyTypeImportCtrl.prototype.close = function() {
  os.ui.window.close(this.element_);
};
goog.exportProperty(
    os.ui.file.AnyTypeImportCtrl.prototype,
    'close',
    os.ui.file.AnyTypeImportCtrl.prototype.close);
