goog.module('os.ui.load.LoadingUI');
goog.module.declareLegacyNamespace();

const ui = goog.require('os.ui');
const LoadingManager = goog.require('os.load.LoadingManager');
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
 * Add the directive to the module.
 */
Module.directive('loading', [directive]);



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
    lm.listen(goog.events.EventType.PROPERTYCHANGE, this.onLoadingChange_, false, this);

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
    lm.unlisten(goog.events.EventType.PROPERTYCHANGE, this.onLoadingChange_, false, this);
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
      ui.apply(this.scope_);
    }
  }
}

exports = {
  Controller,
  directive
};
