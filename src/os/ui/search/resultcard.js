goog.module('os.ui.search.ResultCardUI');

const Module = goog.require('os.ui.Module');

const ISearchResult = goog.requireType('os.search.ISearchResult');


/**
 * The resultcard directive for displaying search results.
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: true,
  template: '<div></div>',
  controller: Controller,
  controllerAs: 'resultCard'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'resultcard';

/**
 * Register the resultcard directive.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the resultcard directive.
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$compile} $compile
   * @ngInject
   */
  constructor($scope, $element, $compile) {
    if ('result' in $scope) {
      // grab the card UI off the result, compile it, and add it to the DOM
      var result = /** @type {ISearchResult} */ ($scope['result']);
      var ui = result.getSearchUI();
      if (ui && ui.startsWith('<')) {
        $element.append($compile(ui)($scope));
      } else {
        $element.append(ui);
      }
    }

    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * Clean up the controller.
   *
   * @private
   */
  destroy_() {
    // nothing to do yet
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
