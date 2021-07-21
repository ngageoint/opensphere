goog.module('os.ui.file.AnyTypeImport');
goog.module.declareLegacyNamespace();

const {ROOT} = goog.require('os');
const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const AlertManager = goog.require('os.alert.AlertManager');
const {isZip} = goog.require('os.file.mime.zip');
const Module = goog.require('os.ui.Module');
const WindowEventType = goog.require('os.ui.WindowEventType');
const osWindow = goog.require('os.ui.window');


/**
 * The KML import directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: true,
  templateUrl: ROOT + 'views/file/anytypeimport.html',
  controller: Controller,
  controllerAs: 'anytype'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'anytypeimport';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the KML import dialog
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
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
     * @type {?os.ui.im.IImportUI}
     * @private
     */
    this['import'] = null;

    this.scope_['isZip'] = this.scope_['file'] ? isZip(this.scope_['file'].getContent()) : false;

    this.scope_.$emit(WindowEventType.READY);
    this.scope_.$on('destroy', function() {
      this.scope_ = null;
      this.element_ = null;
    }.bind(this));
  }

  /**
   * Open the correct importer
   *
   * @export
   */
  accept() {
    try {
      this['import'].launchUI(/** @type {os.file.File} */ (this.scope_['file']), this.scope_['config']);
    } catch (e) {
      AlertManager.getInstance().sendAlert(
          'Error loading file: <b>' + this.scope_['file'].getFileName() + '</b>', AlertEventSeverity.ERROR);
    }

    this.close();
  }

  /**
   * Open the correct importer
   *
   * @export
   */
  close() {
    osWindow.close(this.element_);
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
