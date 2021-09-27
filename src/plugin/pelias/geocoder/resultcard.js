goog.declareModuleId('plugin.pelias.geocoder.ResultCardUI');

import {ROOT} from '../../../os/os.js';
import Module from '../../../os/ui/module.js';
import FeatureResultCardCtrl from '../../../os/ui/search/featureresultcard.js';


/**
 * The Pelias geocoder result card directive for displaying search results.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  templateUrl: ROOT + 'views/plugin/pelias/geocoder/resultcard.html',
  controller: Controller,
  controllerAs: 'resultCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'peliasgeocoderresultcard';


/**
 * Register the directive.
 */
Module.directive('peliasgeocoderresultcard', [directive]);


/**
 * Controller for the resultcard directive.
 * @unrestricted
 */
export class Controller extends FeatureResultCardCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);
  }
}
