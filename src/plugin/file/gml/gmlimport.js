goog.module('plugin.file.gml.GMLImport');
goog.module.declareLegacyNamespace();

const {ROOT} = goog.require('os');
const FileDescriptor = goog.require('os.data.FileDescriptor');
const Module = goog.require('os.ui.Module');
const AbstractFileImportCtrl = goog.require('os.ui.file.ui.AbstractFileImportCtrl');
const GMLDescriptor = goog.require('plugin.file.gml.GMLDescriptor');
const GMLProvider = goog.require('plugin.file.gml.GMLProvider');
const GMLParserConfig = goog.requireType('plugin.file.gml.GMLParserConfig');


/**
 * The GML import directive
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
const directiveTag = 'gmlimport';


/**
 * Add the directive to the module
 */
Module.directive('gmlimport', [directive]);



/**
 * Controller for the GML import dialog
 *
 * @extends {AbstractFileImportCtrl<!GMLParserConfig,!GMLDescriptor>}
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
      descriptor = /** @type {!GMLDescriptor} */ (this.config['descriptor']);
      descriptor.updateFromConfig(this.config);
    } else {
      // this is a new import
      descriptor = new GMLDescriptor(this.config);
      FileDescriptor.createFromConfig(descriptor, GMLProvider.getInstance(), this.config);
    }

    return descriptor;
  }

  /**
   * @inheritDoc
   */
  getProvider() {
    return GMLProvider.getInstance();
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
