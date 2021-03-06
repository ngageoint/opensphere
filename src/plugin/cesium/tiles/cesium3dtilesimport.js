goog.module('plugin.cesium.tiles.TilesetImport');

const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');
const AbstractFileImportCtrl = goog.require('os.ui.file.ui.AbstractFileImportCtrl');
const Descriptor = goog.require('plugin.cesium.tiles.Descriptor');
const Provider = goog.require('plugin.cesium.tiles.Provider');

const FileParserConfig = goog.requireType('os.parse.FileParserConfig');


/**
 * The 3D tiles import directive
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
const directiveTag = 'tilesetimport';


/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);



/**
 * Controller for the 3D tiles import dialog
 *
 * @extends {AbstractFileImportCtrl<!Object,!Descriptor>}
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
      descriptor = /** @type {!Descriptor} */ (this.config['descriptor']);
      descriptor.updateFromConfig(/** @type {!FileParserConfig} */ (this.config));
    } else {
      // this is a new import
      descriptor = Descriptor.create(this.config);
    }

    return descriptor;
  }

  /**
   * @inheritDoc
   */
  getProvider() {
    return Provider.getInstance();
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
