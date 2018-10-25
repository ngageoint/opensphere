goog.provide('plugin.file.gml.GMLImportCtrl');
goog.provide('plugin.file.gml.gmlImportDirective');

goog.require('os.defines');
goog.require('os.ui.Module');
goog.require('os.ui.file.ui.AbstractFileImportCtrl');
goog.require('plugin.file.gml.GMLDescriptor');
goog.require('plugin.file.gml.GMLParserConfig');
goog.require('plugin.file.gml.GMLProvider');


/**
 * The GML import directive
 * @return {angular.Directive}
 */
plugin.file.gml.gmlImportDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/file/genericfileimport.html',
    controller: plugin.file.gml.GMLImportCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('gmlimport', [plugin.file.gml.gmlImportDirective]);



/**
 * Controller for the GML import dialog
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.file.ui.AbstractFileImportCtrl<!plugin.file.gml.GMLParserConfig,!plugin.file.gml.GMLDescriptor>}
 * @constructor
 * @ngInject
 */
plugin.file.gml.GMLImportCtrl = function($scope, $element) {
  plugin.file.gml.GMLImportCtrl.base(this, 'constructor', $scope, $element);
};
goog.inherits(plugin.file.gml.GMLImportCtrl, os.ui.file.ui.AbstractFileImportCtrl);


/**
 * @inheritDoc
 */
plugin.file.gml.GMLImportCtrl.prototype.createDescriptor = function() {
  var descriptor = null;
  if (this.config['descriptor']) {
    // existing descriptor, update it
    descriptor = /** @type {!plugin.file.gml.GMLDescriptor} */ (this.config['descriptor']);
    plugin.file.gml.GMLDescriptor.updateFromConfig(descriptor, this.config);
  } else {
    // this is a new import
    descriptor = plugin.file.gml.GMLDescriptor.createFromConfig(this.config);
  }

  return descriptor;
};


/**
 * @inheritDoc
 */
plugin.file.gml.GMLImportCtrl.prototype.getProvider = function() {
  return plugin.file.gml.GMLProvider.getInstance();
};
