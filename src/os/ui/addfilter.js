goog.provide('os.ui.AddFilter');
goog.provide('os.ui.addFilterDirective');
goog.require('os.MapContainer');
goog.require('os.ui.Module');
goog.require('os.ui.query.ui.AddFilterCtrl');


/**
 * The combinator window directive
 * @return {angular.Directive}
 */
os.ui.addFilterDirective = function() {
  var dir = os.ui.query.ui.addFilterDirective();
  dir.controller = os.ui.AddFilter;
  return dir;
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('osaddfilter', [os.ui.addFilterDirective]);



/**
 * Controller for combinator window
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.query.ui.AddFilterCtrl}
 * @constructor
 * @ngInject
 */
os.ui.AddFilter = function($scope, $element) {
  os.ui.AddFilter.base(this, 'constructor', $scope, $element);
  os.MapContainer.getInstance().listen(os.events.LayerEventType.ADD, this.updateLayers, false, this);
  os.MapContainer.getInstance().listen(os.events.LayerEventType.REMOVE, this.updateLayers, false, this);
  os.MapContainer.getInstance().listen(os.events.LayerEventType.RENAME, this.updateLayers, false, this);
};
goog.inherits(os.ui.AddFilter, os.ui.query.ui.AddFilterCtrl);


/**
 * @inheritDoc
 */
os.ui.AddFilter.prototype.onDestroy = function() {
  os.ui.AddFilter.base(this, 'onDestroy');
  os.MapContainer.getInstance().unlisten(os.events.LayerEventType.ADD, this.updateLayers, false, this);
  os.MapContainer.getInstance().unlisten(os.events.LayerEventType.REMOVE, this.updateLayers, false, this);
  os.MapContainer.getInstance().unlisten(os.events.LayerEventType.RENAME, this.updateLayers, false, this);
};
