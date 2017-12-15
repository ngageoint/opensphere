goog.provide('os.ui.NodeToggleFolderCtrl');
goog.provide('os.ui.nodeToggleFolderDirective');

goog.require('goog.events.EventType');
goog.require('os.ui.Module');
goog.require('os.ui.NodeToggleCtrl');
goog.require('os.ui.nodeToggleDirective');


/**
 * A toggle directive for a node also shows a folder
 * @return {angular.Directive}
 */
os.ui.nodeToggleFolderDirective = function() {
  var dir = os.ui.nodeToggleDirective();
  dir.template = '<span>' + dir.template + '<i class="fa fa-fw action" ' +
      'ng-class="{\'fa-folder\': item.collapsed, \'fa-folder-open\': !item.collapsed}"></i></span>';
  dir.controller = os.ui.NodeToggleFolderCtrl;
  return /** @type {angular.Directive} */ (dir);
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('nodetogglefolder', [os.ui.nodeToggleFolderDirective]);



/**
 * Controller for the node toggle w/ folder directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.NodeToggleCtrl}
 * @constructor
 * @ngInject
 */
os.ui.NodeToggleFolderCtrl = function($scope, $element) {
  os.ui.NodeToggleFolderCtrl.base(this, 'constructor', $scope, $element);
};
goog.inherits(os.ui.NodeToggleFolderCtrl, os.ui.NodeToggleCtrl);


/**
 * @inheritDoc
 */
os.ui.NodeToggleFolderCtrl.prototype.onPropertyChange = function(e) {};


/**
 * @inheritDoc
 */
os.ui.NodeToggleFolderCtrl.prototype.updateOpacity = function() {};
