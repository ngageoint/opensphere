goog.module('plugin.google.places.ResultCardUI');

const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');
const FeatureResultCardCtrl = goog.require('os.ui.search.FeatureResultCardCtrl');


/**
 * The geonames result card directive for displaying search results.
 *
 * @return {angular.Directive}
 */
const directive = () => ({
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
const directiveTag = 'googleplacesresultcard';


/**
 * Register the directive.
 */
Module.directive('googleplacesresultcard', [directive]);



/**
 * Controller for the beresultcard directive.
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
