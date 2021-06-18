goog.module('plugin.file.gpx.ui.GPXImport');
goog.module.declareLegacyNamespace();

const {ROOT} = goog.require('os');
const FileDescriptor = goog.require('os.data.FileDescriptor');
const Module = goog.require('os.ui.Module');
const AbstractFileImportCtrl = goog.require('os.ui.file.ui.AbstractFileImportCtrl');
const GPXDescriptor = goog.require('plugin.file.gpx.GPXDescriptor');
const GPXProvider = goog.require('plugin.file.gpx.GPXProvider');


/**
 * The GPX import directive.
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
const directiveTag = 'gpximport';


/**
 * Add the directive to the module.
 */
Module.directive('gpximport', [directive]);



/**
 * Controller for the GPX import dialog.
 *
 * @extends {AbstractFileImportCtrl<!os.parse.FileParserConfig, !GPXDescriptor>}
 * @unrestricted
 */
class Controller extends AbstractFileImportCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
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
      // existing descriptor. deactivate the descriptor, then update it
      descriptor = this.config['descriptor'];
      descriptor.setActive(false);
      descriptor.updateFromConfig(this.config);
    } else {
      // this is a new import
      descriptor = new GPXDescriptor();
      FileDescriptor.createFromConfig(descriptor, GPXProvider.getInstance(), this.config);
    }

    return descriptor;
  }

  /**
   * @inheritDoc
   */
  getProvider() {
    return GPXProvider.getInstance();
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
