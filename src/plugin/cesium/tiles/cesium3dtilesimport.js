goog.provide('plugin.cesium.tiles.TilesetImportCtrl');
goog.provide('plugin.cesium.tiles.tilesetImportDirective');

goog.require('os.defines');
goog.require('os.ui.Module');
goog.require('os.ui.file.ui.AbstractFileImportCtrl');
goog.require('plugin.cesium.tiles.Descriptor');
goog.require('plugin.cesium.tiles.Provider');


/**
 * The 3D tiles import directive
 *
 * @return {angular.Directive}
 */
plugin.cesium.tiles.tilesetImportDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/file/genericfileimport.html',
    controller: plugin.cesium.tiles.TilesetImportCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('tilesetimport', [plugin.cesium.tiles.tilesetImportDirective]);



/**
 * Controller for the 3D tiles import dialog
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.file.ui.AbstractFileImportCtrl<!Object,!plugin.cesium.tiles.Descriptor>}
 * @constructor
 * @ngInject
 */
plugin.cesium.tiles.TilesetImportCtrl = function($scope, $element) {
  plugin.cesium.tiles.TilesetImportCtrl.base(this, 'constructor', $scope, $element);
};
goog.inherits(plugin.cesium.tiles.TilesetImportCtrl, os.ui.file.ui.AbstractFileImportCtrl);


/**
 * @inheritDoc
 */
plugin.cesium.tiles.TilesetImportCtrl.prototype.createDescriptor = function() {
  var descriptor = null;
  if (this.config['descriptor']) {
    // existing descriptor, update it
    descriptor = /** @type {!plugin.cesium.tiles.Descriptor} */ (this.config['descriptor']);
    descriptor.updateFromConfig(/** @type {!os.parse.FileParserConfig} */ (this.config));
  } else {
    // this is a new import
    descriptor = plugin.cesium.tiles.Descriptor.createFromConfig(this.config);
  }

  return descriptor;
};


/**
 * @inheritDoc
 */
plugin.cesium.tiles.TilesetImportCtrl.prototype.getProvider = function() {
  return plugin.cesium.tiles.Provider.getInstance();
};
