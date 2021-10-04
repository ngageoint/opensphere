goog.declareModuleId('os.ui.layer.ImageLayerUI');

import {ROOT} from '../../os.js';
import Module from '../module.js';
import {Controller as DefaultLayerUICtrl} from './defaultlayerui.js';


/**
 * A spinner directive for a node that loads items
 *
 * @return {angular.Directive}
 */
export const directive = () => {
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
export const directiveTag = 'imagelayerui';


/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);


/**
 * Controller for the image layer UI directive.
 * @unrestricted
 */
export class Controller extends DefaultLayerUICtrl {
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
