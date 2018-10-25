goog.provide('plugin.file.kml.ui.KMLImportCtrl');
goog.provide('plugin.file.kml.ui.kmlImportDirective');

goog.require('os.defines');
goog.require('os.ui.Module');
goog.require('os.ui.file.ui.AbstractFileImportCtrl');
goog.require('plugin.file.kml.KMLDescriptor');
goog.require('plugin.file.kml.KMLProvider');


/**
 * The KML import directive
 * @return {angular.Directive}
 */
plugin.file.kml.ui.kmlImportDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/file/genericfileimport.html',
    controller: plugin.file.kml.ui.KMLImportCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('kmlimport', [plugin.file.kml.ui.kmlImportDirective]);



/**
 * Controller for the KML import dialog
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.file.ui.AbstractFileImportCtrl<!os.parse.FileParserConfig,!plugin.file.kml.KMLDescriptor>}
 * @constructor
 * @ngInject
 */
plugin.file.kml.ui.KMLImportCtrl = function($scope, $element) {
  plugin.file.kml.ui.KMLImportCtrl.base(this, 'constructor', $scope, $element);
};
goog.inherits(plugin.file.kml.ui.KMLImportCtrl, os.ui.file.ui.AbstractFileImportCtrl);


/**
 * @inheritDoc
 */
plugin.file.kml.ui.KMLImportCtrl.prototype.createDescriptor = function() {
  var descriptor = null;
  if (this.config['descriptor']) {
    // existing descriptor, update it
    descriptor = /** @type {!plugin.file.kml.KMLDescriptor} */ (this.config['descriptor']);
    plugin.file.kml.KMLDescriptor.updateFromConfig(descriptor, this.config);
  } else {
    // this is a new import
    descriptor = plugin.file.kml.KMLDescriptor.createFromConfig(this.config);
  }

  return descriptor;
};


/**
 * @inheritDoc
 */
plugin.file.kml.ui.KMLImportCtrl.prototype.getProvider = function() {
  return plugin.file.kml.KMLProvider.getInstance();
};
