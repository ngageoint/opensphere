goog.provide('plugin.georss.GeoRSSImportCtrl');
goog.provide('plugin.georss.georssImportDirective');

goog.require('os.data.DataManager');
goog.require('os.file.FileStorage');
goog.require('os.ui.Module');
goog.require('os.ui.file.ui.AbstractFileImportCtrl');
goog.require('os.ui.window');
goog.require('plugin.georss.defines');


/**
 * The GeoRSS import directive
 * @return {angular.Directive}
 */
/* istanbul ignore next */
plugin.georss.georssImportDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    // The plugin.georss.ROOT define used here helps to fix the paths in the debug instance
    // vs. the compiled instance. This example assumes that you are creating an external
    // plugin. You do not necessarily need a ROOT define per plugin, but rather per project
    // so that the OpenSphere build can find the files properly.
    //
    // For an internal plugin, just require os.defines and use os.ROOT.
    templateUrl: plugin.georss.ROOT + 'views/plugin/georss/georssimport.html',
    controller: plugin.georss.GeoRSSImportCtrl,
    controllerAs: 'georssImport'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('georssimport', [plugin.georss.georssImportDirective]);


/**
 * Controller for the GeoRSS import dialog
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.file.ui.AbstractFileImportCtrl<!os.parse.FileParserConfig, !plugin.georss.GeoRSSDescriptor>}
 * @constructor
 * @ngInject
 */
/* istanbul ignore next */
plugin.georss.GeoRSSImportCtrl = function($scope, $element) {
  plugin.georss.GeoRSSImportCtrl.base(this, 'constructor', $scope, $element);
  this.formName = 'georssForm';
};
goog.inherits(plugin.georss.GeoRSSImportCtrl, os.ui.file.ui.AbstractFileImportCtrl);


/**
 * @inheritDoc
 */
/* istanbul ignore next */
plugin.georss.GeoRSSImportCtrl.prototype.createDescriptor = function() {
  var descriptor = null;
  if (this.config['descriptor']) {
    // existing descriptor, update it
    descriptor = /** @type {!plugin.georss.GeoRSSDescriptor} */ (this.config['descriptor']);
    plugin.georss.GeoRSSDescriptor.updateFromConfig(descriptor, this.config);
  } else {
    // this is a new import
    descriptor = plugin.georss.GeoRSSDescriptor.createFromConfig(this.config);
  }

  return descriptor;
};


/**
 * @inheritDoc
 */
/* istanbul ignore next */
plugin.georss.GeoRSSImportCtrl.prototype.getProvider = function() {
  return plugin.georss.GeoRSSProvider.getInstance();
};
