goog.module('os.ui.filter.TextNoColCheckUI');

const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');


/**
 * A directive that allows for filtering on a numeric column but including a wildcard.
 * The normal directive restricts the filter to be the same type as the column (i.e. decimal).
 * But in this case, we need to allow for a numeric along with a '*'
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'AE',
  replace: true,
  templateUrl: ROOT + 'views/filter/textnocolcheck.html',
  controller: Controller,
  controllerAs: 'textNoColCheckCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'fb-text-no-col-check';

/**
 * Add the directive to the module
 */
Module.directive('fbTextNoColCheck', [directive]);

/**
 * Controller for the between UI
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @ngInject
   */
  constructor($scope) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    this['start'] = undefined;

    if ($scope['expr']['literal'] != null) {
      this['start'] = $scope['expr']['literal'];
    }

    this.onChange();
    $scope.$on('$destroy', this.onDestroy_.bind(this));
  }

  /**
   * clean up
   *
   * @private
   */
  onDestroy_() {
    this.scope_ = null;
  }

  /**
   * Run when the user changes the value
   *
   * @export
   */
  onChange() {
    this.scope_['expr']['literal'] = this['start'];
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
