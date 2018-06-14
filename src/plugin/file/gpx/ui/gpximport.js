goog.provide('plugin.file.gpx.ui.GPXImportCtrl');
goog.provide('plugin.file.gpx.ui.gpxImportDirective');

goog.require('os.defines');
goog.require('os.ui.Module');
goog.require('os.ui.file.ui.AbstractFileImportCtrl');
goog.require('plugin.file.gpx.GPXDescriptor');
goog.require('plugin.file.gpx.GPXProvider');


/**
 * The GPX import directive.
 * @return {angular.Directive}
 */
plugin.file.gpx.ui.gpxImportDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/plugin/gpx/gpximport.html',
    controller: plugin.file.gpx.ui.GPXImportCtrl,
    controllerAs: 'gpxImport'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('gpximport', [plugin.file.gpx.ui.gpxImportDirective]);



/**
 * Controller for the GPX import dialog.
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element The root DOM element.
 * @extends {os.ui.file.ui.AbstractFileImportCtrl<!os.parse.FileParserConfig, !plugin.file.gpx.GPXDescriptor>}
 * @constructor
 * @ngInject
 */
plugin.file.gpx.ui.GPXImportCtrl = function($scope, $element) {
  plugin.file.gpx.ui.GPXImportCtrl.base(this, 'constructor', $scope, $element);
  this.formName = 'gpxForm';
};
goog.inherits(plugin.file.gpx.ui.GPXImportCtrl, os.ui.file.ui.AbstractFileImportCtrl);


/**
 * @inheritDoc
 */
plugin.file.gpx.ui.GPXImportCtrl.prototype.createDescriptor = function() {
  var descriptor = null;
  if (this.config['descriptor']) {
    // existing descriptor. deactivate the descriptor, then update it
    descriptor = this.config['descriptor'];
    descriptor.setActive(false);
    plugin.file.gpx.GPXDescriptor.updateFromConfig(descriptor, this.config);
  } else {
    // this is a new import
    descriptor = plugin.file.gpx.GPXDescriptor.createFromConfig(this.config);
  }

  return descriptor;
};


/**
 * @inheritDoc
 */
plugin.file.gpx.ui.GPXImportCtrl.prototype.getProvider = function() {
  return plugin.file.gpx.GPXProvider.getInstance();
};
