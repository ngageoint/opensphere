goog.provide('os.ui.file.ui.DefaultFileNodeUICtrl');
goog.provide('os.ui.file.ui.defaultFileNodeUIDirective');

goog.require('os.ui.Module');
goog.require('os.ui.data.DescriptorNodeUICtrl');


/**
 * The selected/highlighted file node UI directive.
 *
 * @return {angular.Directive}
 */
os.ui.file.ui.defaultFileNodeUIDirective = function() {
  var directive = os.ui.data.descriptorNodeUIDirective();
  directive.controller = os.ui.file.ui.DefaultFileNodeUICtrl;
  return directive;
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('defaultfilenodeui', [os.ui.file.ui.defaultFileNodeUIDirective]);



/**
 * Controller for selected/highlighted file node UI.
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.data.DescriptorNodeUICtrl}
 * @constructor
 * @ngInject
 */
os.ui.file.ui.DefaultFileNodeUICtrl = function($scope, $element) {
  os.ui.file.ui.DefaultFileNodeUICtrl.base(this, 'constructor', $scope, $element);
};
goog.inherits(os.ui.file.ui.DefaultFileNodeUICtrl, os.ui.data.DescriptorNodeUICtrl);


/**
 * @inheritDoc
 */
os.ui.file.ui.DefaultFileNodeUICtrl.prototype.getRemoveWindowText = function() {
  return 'Are you sure you want to remove this file from the application? ' +
      '<b>This action cannot be undone</b>, and will clear the application history.';
};
