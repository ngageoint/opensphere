goog.module('plugin.file.kml.ui.KMLImport');

const {ROOT} = goog.require('os');
const FileDescriptor = goog.require('os.data.FileDescriptor');
const Module = goog.require('os.ui.Module');
const AbstractFileImportCtrl = goog.require('os.ui.file.ui.AbstractFileImportCtrl');
const KMLDescriptor = goog.require('plugin.file.kml.KMLDescriptor');
const KMLProvider = goog.require('plugin.file.kml.KMLProvider');


/**
 * The KML import directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: true,
  templateUrl: ROOT + 'views/file/genericfileimport.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'kmlimport';


/**
 * Add the directive to the module
 */
Module.directive('kmlimport', [directive]);



/**
 * Controller for the KML import dialog
 *
 * @extends {AbstractFileImportCtrl<!os.parse.FileParserConfig,!KMLDescriptor>}
 * @unrestricted
 */
class Controller extends AbstractFileImportCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);
  }

  /**
   * @inheritDoc
   */
  createDescriptor() {
    var descriptor = null;
    if (this.config['descriptor']) {
      // existing descriptor, update it
      descriptor = /** @type {!KMLDescriptor} */ (this.config['descriptor']);
      descriptor.updateFromConfig(this.config);
    } else {
      // this is a new import
      descriptor = new KMLDescriptor();
      FileDescriptor.createFromConfig(descriptor, KMLProvider.getInstance(), this.config);
    }

    return descriptor;
  }

  /**
   * @inheritDoc
   */
  getProvider() {
    return KMLProvider.getInstance();
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
