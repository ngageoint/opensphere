goog.module('os.ui.load.LoadingUI');

const GoogEventType = goog.require('goog.events.EventType');
const LoadingManager = goog.require('os.load.LoadingManager');
const {apply} = goog.require('os.ui');
const Module = goog.require('os.ui.Module');


/**
 * The loading directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  template: '<i title="Loading..." class="fa fa-spinner fa-smooth fa-spin" ' +
      'ng-if="loadingCtrl.loading"></i>',
  controller: Controller,
  controllerAs: 'loadingCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'loading';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the loading directive.
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    var lm = LoadingManager.getInstance();
    lm.listen(GoogEventType.PROPERTYCHANGE, this.onLoadingChange_, false, this);

    /**
     * @type {boolean}
     */
    this['loading'] = lm.getLoading();

    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * Clean up.
   *
   * @private
   */
  destroy_() {
    var lm = LoadingManager.getInstance();
    lm.unlisten(GoogEventType.PROPERTYCHANGE, this.onLoadingChange_, false, this);
  }

  /**
   * Handler for loading change events.
   *
   * @param {os.events.PropertyChangeEvent} event
   * @private
   */
  onLoadingChange_(event) {
    if (event.getProperty() === LoadingManager.LOADING) {
      this['loading'] = event.getNewValue();
      apply(this.scope_);
    }
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
