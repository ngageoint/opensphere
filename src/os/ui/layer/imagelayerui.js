goog.module('os.ui.layer.ImageLayerUI');
goog.module.declareLegacyNamespace();

const Module = goog.require('os.ui.Module');
const layer = goog.require('os.ui.layer');
const DefaultLayerUICtrl = goog.require('os.ui.layer.DefaultLayerUICtrl');
const {ROOT} = goog.require('os');



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
 * Controller for the addserver directive.
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
    this.initUI();

    if (this.scope) {
      this.scope['styles'] = this.getValue(layer.getStyles);
      this.scope['style'] = this.getValue(layer.getStyle);
    }
  }
}


exports = {
  Controller,
  directive,
  directiveTag
};
