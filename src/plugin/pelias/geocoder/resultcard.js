goog.module('plugin.pelias.geocoder.ResultCardUI');

const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');
const FeatureResultCardCtrl = goog.require('os.ui.search.FeatureResultCardCtrl');


/**
 * The Pelias geocoder result card directive for displaying search results.
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  templateUrl: ROOT + 'views/plugin/pelias/geocoder/resultcard.html',
  controller: Controller,
  controllerAs: 'resultCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'peliasgeocoderresultcard';


/**
 * Register the directive.
 */
Module.directive('peliasgeocoderresultcard', [directive]);


/**
 * Controller for the resultcard directive.
 * @unrestricted
 */
class Controller extends FeatureResultCardCtrl {
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

exports = {
  Controller,
  directive,
  directiveTag
};
