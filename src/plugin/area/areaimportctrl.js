goog.provide('plugin.area.AreaImportCtrl');

goog.require('os.ui.query.ui.AreaImportCtrl');
goog.require('plugin.area');



/**
 * Abstract controller for importing areas from a file.
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout The Angular $timeout service.
 * @extends {os.ui.query.ui.AreaImportCtrl}
 * @constructor
 * @ngInject
 * @template T
 */
plugin.area.AreaImportCtrl = function($scope, $element, $timeout) {
  plugin.area.AreaImportCtrl.base(this, 'constructor', $scope, $element, $timeout);
};
goog.inherits(plugin.area.AreaImportCtrl, os.ui.query.ui.AreaImportCtrl);


/**
 * Get the filename for the source file.
 * @return {string|undefined}
 * @protected
 */
plugin.area.AreaImportCtrl.prototype.getFileName = function() {
  return this.config && this.config['title'] || undefined;
};


/**
 * Process imported features.
 * @param {Array<ol.Feature>} features
 * @protected
 */
plugin.area.AreaImportCtrl.prototype.processFeatures = function(features) {
  this.config[os.data.RecordField.SOURCE_NAME] = this.getFileName();
  plugin.area.processFeatures(features, this.config);
};
