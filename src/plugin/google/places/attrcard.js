goog.declareModuleId('plugin.google.places.AttrCardUI');

import {ROOT} from '../../../os/os.js';

const Module = goog.require('os.ui.Module');


/**
 * The geonames result card directive for displaying search results.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  replace: true,
  restrict: 'E',
  templateUrl: ROOT + 'views/plugin/google/places/attrcard.html',
  controller: Controller,
  controllerAs: 'attrCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'googleplacesattrcard';


/**
 * Register the directive.
 */
Module.directive('googleplacesattrcard', [directive]);



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
    var attrs = /** @type {plugin.google.places.AttrResult} */ ($scope['result']).getResult();

    var html = '';
    for (var i = 0, n = attrs.length; i < n; i++) {
      html += '<div>' + attrs[i] + '</div>';
    }

    $element.html(html);
  }
}
