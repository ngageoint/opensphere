goog.module('os.ui.layer.ImageLayerUI');
goog.module.declareLegacyNamespace();

const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');
const {Controller: DefaultLayerUICtrl} = goog.require('os.ui.layer.DefaultLayerUI');


/**
 * A spinner directive for a node that loads items
 *
 * @return {angular.Directive}
 */
const directive = () => {
  return {
    restrict: 'AE',
    replace: true,
    templateUrl: ROOT + 'views/layer/image.html',
    controller: Controller,
    controllerAs: 'ctrl'
  };
};


/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'imagelayerui';


/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);


/**
 * Controller for the image layer UI directive.
 * @unrestricted
 */
class Controller extends DefaultLayerUICtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
    super($scope, $element, $timeout);
  }
}


exports = {
  Controller,
  directive,
  directiveTag
};
