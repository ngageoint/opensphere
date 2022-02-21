goog.declareModuleId('plugin.pelias.geocoder.AttrCardUI');

import {ROOT} from '../../../os/os.js';
import Module from '../../../os/ui/module.js';

/**
 * The geonames result card directive for displaying search results.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  replace: true,
  restrict: 'E',
  templateUrl: ROOT + 'views/plugin/pelias/geocoder/attrcard.html',
  controller: Controller,
  controllerAs: 'attrCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'peliasgeocoderattrcard';


/**
 * Register the directive.
 */
Module.directive('peliasgeocoderattrcard', [directive]);


/**
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    // just plop the result HTML in
    var attrs = /** @type {AttrResult} */ ($scope['result']).getResult();

    var html = '';
    for (var i = 0, n = attrs.length; i < n; i++) {
      html += '<div>' + attrs[i] + '</div>';
    }

    $element.html(html);
  }
}
