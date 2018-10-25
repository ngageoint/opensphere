goog.provide('os.ui.load.LoadingCtrl');
goog.provide('os.ui.load.loadingDirective');

goog.require('os.load.LoadingManager');
goog.require('os.ui.Module');


/**
 * The loading directive
 * @return {angular.Directive}
 */
os.ui.load.loadingDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    template: '<i title="Loading..." class="fa fa-spinner fa-smooth fa-spin" ' +
        'ng-if="loadingCtrl.loading"></i>',
    controller: os.ui.load.LoadingCtrl,
    controllerAs: 'loadingCtrl'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('loading', [os.ui.load.loadingDirective]);



/**
 * Controller function for the loading directive.
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.load.LoadingCtrl = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  var lm = os.load.LoadingManager.getInstance();
  lm.listen(goog.events.EventType.PROPERTYCHANGE, this.onLoadingChange_, false, this);

  /**
   * @type {boolean}
   */
  this['loading'] = lm.getLoading();

  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Clean up.
 * @private
 */
os.ui.load.LoadingCtrl.prototype.destroy_ = function() {
  var lm = os.load.LoadingManager.getInstance();
  lm.unlisten(goog.events.EventType.PROPERTYCHANGE, this.onLoadingChange_, false, this);
};


/**
 * Handler for loading change events.
 * @param {os.events.PropertyChangeEvent} event
 * @private
 */
os.ui.load.LoadingCtrl.prototype.onLoadingChange_ = function(event) {
  if (event.getProperty() === os.load.LoadingManager.LOADING) {
    this['loading'] = event.getNewValue();
    os.ui.apply(this.scope_);
  }
};
