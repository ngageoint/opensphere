goog.declareModuleId('plugin.google.places.ResultCardUI');

import {ROOT} from '../../../os/os.js';

const Module = goog.require('os.ui.Module');
const FeatureResultCardCtrl = goog.require('os.ui.search.FeatureResultCardCtrl');


/**
 * The geonames result card directive for displaying search results.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  replace: true,
  restrict: 'E',
  templateUrl: ROOT + 'views/plugin/google/places/resultcard.html',
  controller: Controller,
  controllerAs: 'resultCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'googleplacesresultcard';


/**
 * Register the directive.
 */
Module.directive('googleplacesresultcard', [directive]);



/**
 * Controller for the beresultcard directive.
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
